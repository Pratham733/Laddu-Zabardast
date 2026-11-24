package email

import (
	"bytes"
	"context"
	"crypto/tls"
	"encoding/base64"
	"errors"
	"fmt"
	"io"
	"mime"
	"mime/multipart"
	"mime/quotedprintable"
	"net"
	"net/mail"
	"net/smtp"
	"net/textproto"
	"os"
	"strconv"
	"strings"
	"time"
)

type SMTP struct {
	host, port, security string
	user, password       string
	sender, SenderDomain string
}

func IsMailbox(value string) bool {
	addr, err := mail.ParseAddress(value)
	return err == nil && addr.Address == value && !strings.ContainsAny(value, "\r\n")
}

func LoadSMTP() (*SMTP, error) {
	s := SMTP{
		host:     strings.TrimSpace(os.Getenv("ORDER_SMTP_HOST")),
		port:     strings.TrimSpace(os.Getenv("ORDER_SMTP_PORT")),
		security: strings.ToLower(strings.TrimSpace(os.Getenv("ORDER_SMTP_SECURITY"))),
		user:     os.Getenv("ORDER_SMTP_USER"),
		password: os.Getenv("ORDER_SMTP_PASSWORD"),
		sender:   strings.TrimSpace(os.Getenv("ORDER_EMAIL_FROM")),
	}
	if s.host == "" && s.port == "" && s.security == "" && s.user == "" && s.password == "" && s.sender == "" {
		return nil, nil
	}
	if s.host == "" || strings.ContainsAny(s.host, " /\t\r\n") {
		return nil, errors.New("ORDER_SMTP_HOST must be an SMTP hostname or IP address")
	}
	if !IsMailbox(s.sender) {
		return nil, errors.New("ORDER_EMAIL_FROM must be a valid email address")
	}
	s.SenderDomain = s.sender[strings.LastIndex(s.sender, "@")+1:]
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

type Attachment struct {
	Filename    string
	ContentType string
	Data        []byte
}

func (s *SMTP) Send(ctx context.Context, to, messageID, subject, body string, attachments ...Attachment) error {
	if !IsMailbox(to) {
		return errors.New("invalid email recipient")
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
	if _, err := data.Write(FormatMessage(s.sender, to, messageID, subject, body, attachments...)); err != nil {
		return err
	}
	// DATA acknowledgment is the relay's acceptance of this message.
	if err := data.Close(); err != nil {
		return err
	}
	_ = client.Quit()
	return nil
}

func FormatMessage(from, to, messageID, subject, body string, attachments ...Attachment) []byte {
	var message bytes.Buffer
	fmt.Fprintf(&message, "From: %s\r\nTo: %s\r\nSubject: %s\r\nDate: %s\r\nMessage-ID: <%s>\r\n",
		(&mail.Address{Name: "Laddu Zabardast", Address: from}).String(),
		(&mail.Address{Address: to}).String(), mime.QEncoding.Encode("UTF-8", subject),
		time.Now().Format(time.RFC1123Z), messageID)
	message.WriteString("MIME-Version: 1.0\r\n")
	const bodyType = "text/plain; charset=UTF-8"
	const bodyEncoding = "quoted-printable"
	if len(attachments) == 0 {
		fmt.Fprintf(&message, "Content-Type: %s\r\nContent-Transfer-Encoding: %s\r\n\r\n", bodyType, bodyEncoding)
		writeQuotedBody(&message, body)
		return message.Bytes()
	}

	mixed := multipart.NewWriter(&message)
	fmt.Fprintf(&message, "Content-Type: multipart/mixed; boundary=%s\r\n\r\n", mixed.Boundary())
	// All parts write to a bytes.Buffer.
	part, _ := mixed.CreatePart(textproto.MIMEHeader{
		"Content-Type": {bodyType}, "Content-Transfer-Encoding": {bodyEncoding},
	})
	writeQuotedBody(part, body)

	for _, file := range attachments {
		disposition := mime.FormatMediaType("attachment", map[string]string{"filename": file.Filename})
		part, _ = mixed.CreatePart(textproto.MIMEHeader{
			"Content-Type": {file.ContentType}, "Content-Disposition": {disposition},
			"Content-Transfer-Encoding": {"base64"},
		})
		for data := file.Data; len(data) > 0; {
			chunk := min(57, len(data)) // 76 base64 characters per MIME line.
			fmt.Fprint(part, base64.StdEncoding.EncodeToString(data[:chunk]), "\r\n")
			data = data[chunk:]
		}
	}
	_ = mixed.Close()
	return message.Bytes()
}

func writeQuotedBody(dst io.Writer, text string) {
	writer := quotedprintable.NewWriter(dst)
	_, _ = io.WriteString(writer, text)
	_ = writer.Close()
}
