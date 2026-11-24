package order

import (
	"bytes"
	"compress/zlib"
	_ "embed"
	"image"
	"image/color"
	"image/png"
)

//go:embed assets/invoice-logo.png
var invoiceLogoPNG []byte

var invoiceLogo = loadInvoiceLogo()

type pdfLogo struct {
	width, height int
	rgb, alpha    []byte
}

func loadInvoiceLogo() pdfLogo {
	img, err := png.Decode(bytes.NewReader(invoiceLogoPNG))
	if err != nil {
		panic("invalid embedded invoice logo: " + err.Error())
	}
	source := img.Bounds()
	// 128 pixels at 40 points is over 230 DPI in the printed invoice.
	width := 128
	height := max(1, source.Dy()*width/source.Dx())
	bounds := image.Rect(0, 0, width, height)
	pixels := bounds.Dx() * bounds.Dy()
	rgb, alpha := make([]byte, 0, pixels*3), make([]byte, 0, pixels)
	for y := bounds.Min.Y; y < bounds.Max.Y; y++ {
		for x := bounds.Min.X; x < bounds.Max.X; x++ {
			c := color.NRGBAModel.Convert(img.At(source.Min.X+x*source.Dx()/width, source.Min.Y+y*source.Dy()/height)).(color.NRGBA)
			rgb = append(rgb, c.R, c.G, c.B)
			alpha = append(alpha, c.A)
		}
	}
	return pdfLogo{width: bounds.Dx(), height: bounds.Dy(), rgb: deflatePDF(rgb), alpha: deflatePDF(alpha)}
}

func deflatePDF(data []byte) []byte {
	var buf bytes.Buffer
	encoder := zlib.NewWriter(&buf)
	// Writing to a bytes.Buffer cannot fail.
	_, _ = encoder.Write(data)
	_ = encoder.Close()
	return buf.Bytes()
}
