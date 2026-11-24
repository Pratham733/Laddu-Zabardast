package order

import (
	"bytes"
	"fmt"
	"math"
	"os"
	"strings"
	"time"

	"github.com/Pratham733/laddu-zabardast-be/src/config"
)

const (
	invoicePageStart  = 759
	invoiceItemHeader = 25
	pageWidth         = 595
	pageHeight        = 842
	leftEdge          = 30
	rightEdge         = pageWidth - leftEdge
	minItemY          = 62
	ink               = "0.08 0.08 0.08"
	navy              = "0.08 0.16 0.30"
	gray              = "0.92 0.93 0.94"
	line              = "0.69 0.70 0.71"
)

type invoiceLayout struct {
	invoice issuedInvoice
	pages   []*bytes.Buffer
	page    *bytes.Buffer
	y       int
}

// PDF base fonts use WinAnsi. Use an octal escape for extended characters and
// keep user-provided text inside a single PDF string literal.
func pdfLiteral(text string) string {
	var out strings.Builder
	for _, r := range text {
		switch {
		case r == '\\' || r == '(' || r == ')':
			out.WriteByte('\\')
			out.WriteRune(r)
		case r >= 32 && r <= 126:
			out.WriteRune(r)
		case r >= 160 && r <= 255:
			fmt.Fprintf(&out, "\\%03o", r)
		case r == '’' || r == '‘':
			out.WriteByte('\'')
		case r == '“' || r == '”':
			out.WriteByte('"')
		case r == '–' || r == '—':
			out.WriteByte('-')
		default:
			out.WriteByte('?')
		}
	}
	return out.String()
}

func textAt(page *bytes.Buffer, x float64, y, size int, font, color, text string) {
	fmt.Fprintf(page, "BT /%s %d Tf %s rg 1 0 0 1 %.2f %d Tm (%s) Tj ET\n", font, size, color, x, y, pdfLiteral(text))
}

func rect(page *bytes.Buffer, x, y, w, h int, color string) {
	fmt.Fprintf(page, "%s rg %d %d %d %d re f\n", color, x, y, w, h)
}

// Use exact Helvetica widths for digits and separators (the amount columns).
// For running text, use conservative widths when deciding where to wrap.
func textWidth(s string, size int) float64 {
	var width float64
	for _, r := range s {
		switch {
		case r >= '0' && r <= '9':
			width += 0.556
		case r == '.' || r == ',' || r == ' ':
			width += 0.278
		case r == 'W' || r == 'M' || r == 'w' || r == 'm':
			width += 0.96
		case r >= 'a' && r <= 'z':
			width += 0.65
		default:
			width += 0.9
		}
	}
	return width * float64(size)
}

func wrapInvoiceText(s string, size, maxWidth int) []string {
	s = strings.Join(strings.Fields(s), " ")
	var lines []string
	for s != "" {
		lastBreak, end := -1, len(s)
		for i, r := range s {
			if textWidth(s[:i+len(string(r))], size) > float64(maxWidth) {
				end = i
				if lastBreak > 0 {
					end = lastBreak
				}
				break
			}
			if r == ' ' {
				lastBreak = i
			}
		}
		lines = append(lines, strings.TrimSpace(s[:end]))
		s = strings.TrimSpace(s[end:])
	}
	return lines
}

func boxAt(page *bytes.Buffer, x, y, w, h int) {
	fmt.Fprintf(page, "0.12 0.12 0.12 RG 0.7 w %d %d %d %d re S\n", x, y, w, h)
}

func (d *invoiceLayout) startPage() {
	d.page = new(bytes.Buffer)
	d.pages = append(d.pages, d.page)
	// Put the logo in the title area so seller details can use the full grid width.
	const logoSize = 40
	scale := logoSize / float64(max(invoiceLogo.width, invoiceLogo.height))
	fmt.Fprintf(d.page, "q %.2f 0 0 %.2f %d %d cm /Logo Do Q\n", scale*float64(invoiceLogo.width), scale*float64(invoiceLogo.height), leftEdge, 766)
	const title = "INVOICE"
	textAt(d.page, (pageWidth-textWidth(title, 18))/2, 795, 18, "F2", ink, title)
	if len(d.pages) > 1 {
		textAt(d.page, leftEdge+56, 770, 9, "F1", ink, "Invoice no. "+d.invoice.number()+" (continued)")
	}
	d.y = invoicePageStart
}

func configuredInvoiceValue(key string) string {
	// Keep configured details compact enough to fit into the printed blocks.
	value := []rune(strings.TrimSpace(os.Getenv(key)))
	return string(value[:min(len(value), 280)])
}

type invoiceBlock struct {
	title string
	lines []string
}

func (d *invoiceLayout) blockRow(split int, left, right invoiceBlock) {
	const fontSize, leading, padding = 9, 13, 7
	leftWidth, rightWidth := split-leftEdge, rightEdge-split
	leftLines := wrapBlock(left.lines, fontSize, leftWidth-2*padding)
	rightLines := wrapBlock(right.lines, fontSize, rightWidth-2*padding)
	for {
		if d.y < minItemY+52 {
			d.startPage()
		}
		capacity := (d.y - minItemY - 26) / leading
		count := min(capacity, max(len(leftLines), len(rightLines)))
		height := 26 + count*leading
		for _, cell := range []struct {
			x, width int
			title    string
			lines    []string
		}{{leftEdge, leftWidth, left.title, leftLines[:min(count, len(leftLines))]}, {split, rightWidth, right.title, rightLines[:min(count, len(rightLines))]}} {
			boxAt(d.page, cell.x, d.y-height, cell.width, height)
			size := 10
			for size > 6 && textWidth(cell.title, size) > float64(cell.width-2*padding) {
				size--
			}
			title := wrapInvoiceText(cell.title, size, cell.width-2*padding)
			if len(title) > 0 {
				textAt(d.page, float64(cell.x+padding), d.y-15, size, "F2", navy, title[0])
			}
			for i, detail := range cell.lines {
				textAt(d.page, float64(cell.x+padding), d.y-30-i*leading, fontSize, "F1", ink, detail)
			}
		}
		d.y -= height
		leftLines = leftLines[min(count, len(leftLines)):]
		rightLines = rightLines[min(count, len(rightLines)):]
		if len(leftLines) == 0 && len(rightLines) == 0 {
			return
		}
		d.startPage()
	}
}

func wrapBlock(lines []string, fontSize, width int) []string {
	var result []string
	for _, line := range lines {
		result = append(result, wrapInvoiceText(line, fontSize, width)...)
	}
	return result
}

func invoiceCustomerName(ord Order) string {
	return strings.TrimSpace(ord.ShippingDetails.Name)
}

func (d *invoiceLayout) orderDetails(ord Order) {
	shipping := ord.ShippingDetails
	addr := shipping.Address
	if addr == "" {
		addr = shipping.Street
	}
	postal := shipping.PostalCode
	if postal == "" {
		postal = shipping.Zip
	}
	address := strings.Join(nonEmpty(addr, shipping.City, shipping.State, postal, shipping.Country), ", ")
	support := config.StoreSupport()
	name := configuredInvoiceValue("INVOICE_SELLER_NAME")
	if name == "" {
		name = "Laddu Zabardast"
	}
	seller := invoiceBlock{name, nonEmpty(configuredInvoiceValue("INVOICE_SELLER_ADDRESS"), "Email: "+support.Email, strings.Join(support.Phones, ", "))}
	orderDate := ord.CreatedAt
	if orderDate == "" {
		orderDate = ord.Date
	}
	if parsed, err := time.Parse(time.RFC3339, orderDate); err == nil {
		orderDate = parsed.In(invoiceZone).Format("02 Jan 2006")
	}
	refs := invoiceBlock{"INVOICE DETAILS", nonEmpty(
		"Invoice No.: "+d.invoice.number(),
		"Invoice Date: "+d.invoice.IssuedAt.In(invoiceZone).Format("02 Jan 2006"),
		"Order Ref.: "+ord.ID,
		"Ordered: "+orderDate,
	)}
	if shipping.State != "" {
		refs.lines = append(refs.lines, "Delivery State: "+shipping.State)
	}
	d.blockRow(326, seller, refs)
	customer := nonEmpty(invoiceCustomerName(ord), address, shipping.Email, shipping.Phone)
	d.blockRow(326, invoiceBlock{"BILLED TO", customer}, invoiceBlock{"SHIPPED TO", customer})
	d.y -= 26
}

func nonEmpty(values ...string) []string {
	var result []string
	for _, value := range values {
		if value = strings.TrimSpace(value); value != "" {
			result = append(result, value)
		}
	}
	return result
}

func paymentLabel(status string) string {
	switch strings.ToLower(status) {
	case "paid", "completed":
		return "Payment received"
	case "pending":
		return "Payment pending"
	case "failed":
		return "Payment failed"
	default:
		return status
	}
}

var itemEdges = [...]int{leftEdge, 55, 236, 282, 310, 343, 398, 458, 501, rightEdge}

func itemGrid(page *bytes.Buffer, bottom, top int) {
	boxAt(page, leftEdge, bottom, rightEdge-leftEdge, top-bottom)
	for _, x := range itemEdges[1 : len(itemEdges)-1] {
		rect(page, x, bottom, 1, top-bottom, line)
	}
}

func (d *invoiceLayout) itemHeader() {
	if d.y < 132 {
		d.startPage()
	}
	top := d.y
	d.y -= invoiceItemHeader
	rect(d.page, leftEdge, d.y, rightEdge-leftEdge, invoiceItemHeader, gray)
	itemGrid(d.page, d.y, top)
	for i, title := range []string{"S.N.", "Description of Goods / Services", "HSN/SAC", "Qty", "Unit", "Rate (INR)", "Taxable Value", "GST", "Total (INR)"} {
		textAt(d.page, float64(itemEdges[i]+5), top-16, 8, "F2", ink, title)
	}
}

func (d *invoiceLayout) item(index int, item OrderItem) {
	title := strings.TrimSpace(item.Name)
	if title == "" {
		title = "Item"
	}
	details := nonEmpty(title, item.Sweetener.Label())
	if item.Box != nil {
		for _, laddu := range item.Box.Items {
			details = append(details, fmt.Sprintf("%d x %s per box", laddu.Quantity, laddu.Name))
		}
	}
	lines := wrapBlock(details, 9, itemEdges[2]-itemEdges[1]-12)
	unit := "PCS"
	if item.Box != nil {
		unit = "BOX"
	}
	const leading, padding = 13, 10
	const fullPageCapacity = (invoicePageStart - invoiceItemHeader - minItemY - padding) / leading
	if height := padding + len(lines)*leading; len(lines) <= fullPageCapacity && d.y-height < minItemY {
		d.startPage()
		d.itemHeader()
	}
	first := true
	for len(lines) > 0 {
		space := (d.y - minItemY - 10) / leading
		if space < 1 {
			d.startPage()
			d.itemHeader()
			continue
		}
		take := min(space, len(lines))
		height := padding + leading*take
		itemGrid(d.page, d.y-height, d.y)
		for i, detail := range lines[:take] {
			textAt(d.page, float64(itemEdges[1]+5), d.y-16-i*leading, 9, "F1", ink, detail)
		}
		if first {
			values := [...]string{fmt.Sprint(index), "-", fmt.Sprint(item.Quantity), unit, invoiceMoney(item.Price), "-", "-", invoiceMoney(float64(item.Quantity) * item.Price)}
			for i, column := range []int{0, 2, 3, 4, 5, 6, 7, 8} {
				value := values[i]
				x := float64(itemEdges[column+1]-5) - textWidth(value, 8)
				textAt(d.page, x, d.y-16, 8, "F1", ink, value)
			}
		}
		first = false
		d.y -= height
		lines = lines[take:]
	}
}

func invoiceMoney(amount float64) string {
	whole, cents, ok := strings.Cut(fmt.Sprintf("%.2f", amount), ".")
	negative := strings.HasPrefix(whole, "-")
	whole = strings.TrimPrefix(whole, "-")
	if !ok {
		return fmt.Sprint(amount)
	}
	var formatted strings.Builder
	if negative {
		formatted.WriteByte('-')
	}
	for i := range len(whole) {
		if i > 0 && (len(whole)-i)%3 == 0 {
			formatted.WriteByte(',')
		}
		formatted.WriteByte(whole[i])
	}
	formatted.WriteByte('.')
	formatted.WriteString(cents)
	return formatted.String()
}

func invoiceWords(n int64) string {
	small := [...]string{"zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine",
		"ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"}
	tens := [...]string{"", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"}
	if n < 20 {
		return small[n]
	}
	if n < 100 {
		if n%10 == 0 {
			return tens[n/10]
		}
		return tens[n/10] + "-" + small[n%10]
	}
	for _, unit := range []struct {
		scale int64
		name  string
	}{{10000000, "crore"}, {100000, "lakh"}, {1000, "thousand"}, {100, "hundred"}} {
		if n >= unit.scale {
			prefix := invoiceWords(n/unit.scale) + " " + unit.name
			if n%unit.scale != 0 {
				prefix += " " + invoiceWords(n%unit.scale)
			}
			return prefix
		}
	}
	return ""
}

func invoiceTotalWords(total float64) string {
	if total < 0 || math.IsNaN(total) || total >= float64(math.MaxInt64)/100 {
		return "INR " + invoiceMoney(total)
	}
	paise := int64(math.Round(total * 100))
	words := "Indian rupees " + invoiceWords(paise/100)
	if paise%100 != 0 {
		words += " and " + invoiceWords(paise%100) + " paise"
	}
	return words + " only"
}

func (d *invoiceLayout) totals(ord Order) {
	method := ord.PaymentMethod
	switch strings.ToLower(method) {
	case "cod", "cash":
		method = "Cash on delivery"
	case "upi":
		method = "UPI"
	}
	payment := nonEmpty(method, paymentLabel(ord.PaymentStatus))
	bankDetails := configuredInvoiceValue("INVOICE_BANK_DETAILS")
	if bankDetails != "" {
		payment = append(payment, nonEmpty(strings.Split(bankDetails, "\n")...)...)
	}
	words := wrapInvoiceText("Invoice Value (in words): "+invoiceTotalWords(ord.TotalAmount), 9, rightEdge-leftEdge-14)
	paymentLines := wrapBlock(payment, 9, 318-leftEdge-14)
	if d.y < minItemY+170+13*(len(words)+len(paymentLines)) {
		d.startPage()
	}
	total := invoiceMoney(ord.TotalAmount)
	for i, entry := range []struct{ label, value string }{
		{"Subtotal", total}, {"Integrated GST (IGST)", "-"}, {"Central GST (CGST)", "-"},
		{"State GST (SGST)", "-"}, {"Invoice Total (INR)", total},
	} {
		if i == 4 {
			rect(d.page, leftEdge, d.y-19, rightEdge-leftEdge, 19, gray)
		}
		boxAt(d.page, leftEdge, d.y-19, rightEdge-leftEdge, 19)
		rect(d.page, 483, d.y-19, 1, 19, line)
		textAt(d.page, 473-textWidth(entry.label, 9), d.y-13, 9, "F2", ink, entry.label)
		textAt(d.page, rightEdge-7-textWidth(entry.value, 9), d.y-13, 9, "F1", ink, entry.value)
		d.y -= 19
	}
	d.y -= 18
	height := 12 + 13*len(words)
	boxAt(d.page, leftEdge, d.y-height, rightEdge-leftEdge, height)
	for i, entry := range words {
		textAt(d.page, leftEdge+7, d.y-15-i*13, 9, "F2", ink, entry)
	}
	d.y -= height + 18
	d.blockRow(318, invoiceBlock{"PAYMENT DETAILS", payment}, invoiceBlock{"LADDU ZABARDAST", []string{"Authorized signatory", " "}})
}

func generatePDFBytes(ord Order, invoice issuedInvoice) []byte {
	d := invoiceLayout{invoice: invoice}
	d.startPage()
	d.orderDetails(ord)
	d.itemHeader()
	for i, item := range ord.Items {
		d.item(i+1, item)
	}
	d.totals(ord)
	for i, page := range d.pages {
		rect(page, leftEdge, 48, rightEdge-leftEdge, 1, line)
		textAt(page, 488, 32, 9, "F1", ink, fmt.Sprintf("Page %d of %d", i+1, len(d.pages)))
	}
	return encodeInvoicePDF(d.pages)
}

func encodeInvoicePDF(pages []*bytes.Buffer) []byte {
	var pdf bytes.Buffer
	pdf.WriteString("%PDF-1.4\n")
	const logoID, maskID, firstPageID = 5, 6, 7
	offsets := make([]int, firstPageID+2*len(pages))
	writeObject := func(id int, format string, args ...any) {
		offsets[id] = pdf.Len()
		fmt.Fprintf(&pdf, "%d 0 obj\n", id)
		fmt.Fprintf(&pdf, format, args...)
		pdf.WriteString("\nendobj\n")
	}

	var kids strings.Builder
	for i := range pages {
		fmt.Fprintf(&kids, "%d 0 R ", firstPageID+2*i)
	}
	writeObject(1, "<< /Type /Catalog /Pages 2 0 R >>")
	writeObject(2, "<< /Type /Pages /Kids [%s] /Count %d >>", kids.String(), len(pages))
	writeObject(3, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>")
	writeObject(4, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>")
	writeObject(logoID, "<< /Type /XObject /Subtype /Image /Width %d /Height %d /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /FlateDecode /SMask %d 0 R /Length %d >>\nstream\n%s\nendstream",
		invoiceLogo.width, invoiceLogo.height, maskID, len(invoiceLogo.rgb), invoiceLogo.rgb)
	writeObject(maskID, "<< /Type /XObject /Subtype /Image /Width %d /Height %d /ColorSpace /DeviceGray /BitsPerComponent 8 /Filter /FlateDecode /Length %d >>\nstream\n%s\nendstream",
		invoiceLogo.width, invoiceLogo.height, len(invoiceLogo.alpha), invoiceLogo.alpha)
	for i, page := range pages {
		id := firstPageID + 2*i
		writeObject(id, "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 %d %d] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> /XObject << /Logo %d 0 R >> >> /Contents %d 0 R >>", pageWidth, pageHeight, logoID, id+1)
		compressed := deflatePDF(page.Bytes())
		writeObject(id+1, "<< /Filter /FlateDecode /Length %d >>\nstream\n%s\nendstream", len(compressed), compressed)
	}
	xrefOffset := pdf.Len()
	fmt.Fprintf(&pdf, "xref\n0 %d\n0000000000 65535 f \n", len(offsets))
	for _, offset := range offsets[1:] {
		fmt.Fprintf(&pdf, "%010d 00000 n \n", offset)
	}
	fmt.Fprintf(&pdf, "trailer\n<< /Size %d /Root 1 0 R >>\nstartxref\n%d\n%%%%EOF\n", len(offsets), xrefOffset)
	return pdf.Bytes()
}
