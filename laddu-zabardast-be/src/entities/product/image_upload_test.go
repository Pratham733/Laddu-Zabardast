package product

import (
	"bytes"
	"image"
	"image/color"
	"image/jpeg"
	"image/png"
	"testing"
)

func TestOptimizeProductImage(t *testing.T) {
	t.Run("resizes opaque product images", func(t *testing.T) {
		var source bytes.Buffer
		img := image.NewRGBA(image.Rect(0, 0, 2000, 1000))
		img.Pix = bytes.Repeat([]byte{243, 204, 140, 255}, 2000*1000)
		if err := png.Encode(&source, img); err != nil {
			t.Fatal(err)
		}
		data, mime, ext, err := optimizeProductImage(bytes.NewReader(source.Bytes()))
		if err != nil {
			t.Fatal(err)
		}
		info, err := jpeg.DecodeConfig(bytes.NewReader(data))
		if err != nil || info.Width != 1600 || info.Height != 800 || mime != "image/jpeg" || ext != ".jpg" {
			t.Fatalf("expected a 1600×800 JPEG, got %v %s %s (%v)", info, mime, ext, err)
		}
	})

	t.Run("preserves PNG transparency", func(t *testing.T) {
		var source bytes.Buffer
		img := image.NewNRGBA(image.Rect(0, 0, 8, 4))
		img.SetNRGBA(1, 1, color.NRGBA{R: 255, A: 90})
		if err := png.Encode(&source, img); err != nil {
			t.Fatal(err)
		}
		data, mime, ext, err := optimizeProductImage(bytes.NewReader(source.Bytes()))
		if err != nil {
			t.Fatal(err)
		}
		result, err := png.Decode(bytes.NewReader(data))
		if err != nil {
			t.Fatal(err)
		}
		_, _, _, alpha := result.At(1, 1).RGBA()
		if alpha != 90*257 || result.Bounds() != img.Bounds() || mime != "image/png" || ext != ".png" {
			t.Fatal("transparent image or its dimensions changed")
		}
	})

	t.Run("rejects malformed data", func(t *testing.T) {
		if _, _, _, err := optimizeProductImage(bytes.NewReader([]byte("invalid"))); err == nil {
			t.Fatal("invalid image was accepted")
		}
	})
}
