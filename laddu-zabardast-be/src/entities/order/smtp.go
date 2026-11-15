package order

import (
	"bytes"
	"context"
	"crypto/tls"
	"errors"
	"fmt"
	"io"
	"mime"
	"mime/quotedprintable"
	"net"
	"net/mail"
	"net/smtp"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/Pratham733/laddu-zabardast-be/src/config"
)

type smtpSettings struct {
	host, port, security string
	user, password       string
	sender, senderDomain string
	admin                string
}

func isMailbox(value string) bool {
	addr, err := mail.ParseAddress(value)
	return err == nil && addr.Address == value && !strings.ContainsAny(value, "\r\n")
}

func orderAdminEmail() string {
	if override := strings.TrimSpace(os.Getenv("ORDER_EMAIL_ADMIN")); override != "" {
		return override
	}
	return strings.TrimSpace(config.AppConfig.Credentials.AdminEmail)
}

func loadSMTPSettings() (*smtpSettings, error) {
	file := config.AppConfig.Credentials.SMTP
	value := func(key, fallback string) string {
		if env, set := os.LookupEnv(key); set {
			return env
		}
		return fallback
	}
	s := smtpSettings{
		host:     strings.TrimSpace(value("ORDER_SMTP_HOST", file.Host)),
		port:     strings.TrimSpace(value("ORDER_SMTP_PORT", file.Port)),
		security: strings.ToLower(strings.TrimSpace(value("ORDER_SMTP_SECURITY", file.Security))),
		user:     value("ORDER_SMTP_USER", file.User),
		password: value("ORDER_SMTP_PASSWORD", file.Password),
		sender:   strings.TrimSpace(value("ORDER_EMAIL_FROM", file.Sender)),
		admin:    orderAdminEmail(),
	}
	if s.host == "" && s.port == "" && s.security == "" && s.user == "" && s.password == "" && s.sender == "" {
		return nil, nil
	}
	if s.host == "" || strings.ContainsAny(s.host, " /\t\r\n") {
		return nil, errors.New("ORDER_SMTP_HOST must be an SMTP hostname or IP address")
	}
	if !isMailbox(s.sender) || !isMailbox(s.admin) {
		return nil, errors.New("ORDER_EMAIL_FROM and ORDER_EMAIL_ADMIN must be valid email addresses")
	}
	s.senderDomain = s.sender[strings.LastIndex(s.sender, "@")+1:]
	if (s.user == "") != (s.password == "") {
		return nil, errors.New("set both ORDER_SMTP_USER and ORDER_SMTP_PASSWORD for SMTP authentication")
	}
	if s.security == "" {
		s.security = "starttls"
	}
	defaultPort := "587"
	switch s.security {
	case "starttls":
	case "tls":
		defaultPort = "465"
	case "plain":
		ip := net.ParseIP(s.host)
		if (s.host != "localhost" && (ip == nil || !ip.IsLoopback())) || s.user != "" {
			return nil, errors.New("plain SMTP is limited to an unauthenticated loopback relay")
		}
		defaultPort = "25"
	default:
		return nil, errors.New("ORDER_SMTP_SECURITY must be starttls, tls, or plain")
	}
	if s.port == "" {
		s.port = defaultPort
	}
	port, err := strconv.Atoi(s.port)
	if err != nil || port < 1 || port > 65535 {
		return nil, errors.New("ORDER_SMTP_PORT must be a valid TCP port")
	}
	return &s, nil
}

func (s *smtpSettings) send(ctx context.Context, to, messageID, subject, body string) error {
	if !isMailbox(to) {
		return errors.New("invalid order email recipient")
	}
	ctx, cancel := context.WithTimeout(ctx, 15*time.Second)
	defer cancel()
	deadline, _ := ctx.Deadline()
	dialer := &net.Dialer{}
	server := net.JoinHostPort(s.host, s.port)
	tlsConfig := &tls.Config{ServerName: s.host, MinVersion: tls.VersionTLS12}
	var conn net.Conn
	var err error
	if s.security == "tls" {
		conn, err = (&tls.Dialer{NetDialer: dialer, Config: tlsConfig}).DialContext(ctx, "tcp", server)
	} else {
		conn, err = dialer.DialContext(ctx, "tcp", server)
	}
	if err != nil {
		return err
	}
	defer conn.Close()
	if err := conn.SetDeadline(deadline); err != nil {
		return err
	}
	client, err := smtp.NewClient(conn, s.host)
	if err != nil {
		return err
	}
	if s.security == "starttls" {
		if err := client.StartTLS(tlsConfig); err != nil {
			return err
		}
	}
	if s.user != "" {
		if err := client.Auth(smtp.PlainAuth("", s.user, s.password, s.host)); err != nil {
			return err
		}
	}
	if err := client.Mail(s.sender); err != nil {
		return err
	}
	if err := client.Rcpt(to); err != nil {
		return err
	}
	data, err := client.Data()
	if err != nil {
		return err
	}
	if _, err := data.Write(formatMessage(s.sender, to, messageID, subject, body)); err != nil {
		return err
	}
	// DATA acknowledgment is the relay's acceptance of this message.
	if err := data.Close(); err != nil {
		return err
	}
	_ = client.Quit()
	return nil
}

func formatMessage(from, to, messageID, subject, body string) []byte {
	var message bytes.Buffer
	fmt.Fprintf(&message, "From: %s\r\nTo: %s\r\nSubject: %s\r\nDate: %s\r\nMessage-ID: <%s>\r\n",
		(&mail.Address{Name: "Laddu Zabardast", Address: from}).String(),
		(&mail.Address{Address: to}).String(), mime.QEncoding.Encode("UTF-8", subject),
		time.Now().Format(time.RFC1123Z), messageID)
	message.WriteString("MIME-Version: 1.0\r\nContent-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: quoted-printable\r\n\r\n")
	writer := quotedprintable.NewWriter(&message)
	io.WriteString(writer, body)
	writer.Close()
	return message.Bytes()
}
