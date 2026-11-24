package product

import (
	"bytes"
	"errors"
	"image"
	"image/jpeg"
	"image/png"
	"io"
	"log"
	"net/http"
	"path/filepath"

	"github.com/Pratham733/laddu-zabardast-be/src/productimage"
	"github.com/disintegration/imaging"
	"github.com/google/uuid"
	_ "golang.org/x/image/webp"
)

const (
	maxImageBytes  = 10 << 20
	maxImagePixels = 24_000_000
	maxImageSide   = 1600
)

func uploadProductImage(store productimage.Store) func(http.ResponseWriter, *http.Request) (*UploadImageResponsePacket, error) {
	// Keep large decodes from overlapping on a small web-service instance.
	imageSlot := make(chan struct{}, 1)
	return func(w http.ResponseWriter, r *http.Request) (*UploadImageResponsePacket, error) {
		r.Body = http.MaxBytesReader(w, r.Body, maxImageBytes+(1<<20))
		if err := r.ParseMultipartForm(1 << 20); err != nil {
			return nil, errors.New("file too large or invalid multipart form")
		}
		defer r.MultipartForm.RemoveAll()

		file, header, err := r.FormFile("image")
		if err != nil {
			return nil, errors.New("missing 'image' file field")
		}
		defer file.Close()
		if header.Size <= 0 || header.Size > maxImageBytes {
			return nil, errors.New("choose an image up to 10 MB")
		}

		ext := filepath.Ext(header.Filename)
		if err := validateImageExtension(ext); err != nil {
			return nil, err
		}
		var prefix [512]byte
		n, err := io.ReadFull(file, prefix[:])
		if err != nil && !errors.Is(err, io.ErrUnexpectedEOF) {
			return nil, errors.New("could not read image")
		}
		contentType := http.DetectContentType(prefix[:n])
		if !imageMatchesExtension(ext, contentType) {
			return nil, errors.New("image content does not match its extension")
		}
		if _, err := file.Seek(0, io.SeekStart); err != nil {
			return nil, errors.New("could not read image")
		}

		select {
		case imageSlot <- struct{}{}:
		case <-r.Context().Done():
			return nil, errors.New("upload timed out, please try again")
		}
		data, contentType, ext, err := optimizeProductImage(file)
		<-imageSlot
		if err != nil {
			return nil, err
		}

		filename := uuid.NewString() + ext
		imageURL, err := store.Put(r.Context(), filename, contentType, data)
		if err != nil {
			log.Printf("product image upload failed: %v", err)
			return nil, errors.New("could not save the product image, please try again")
		}
		return &UploadImageResponsePacket{
			ImageUrl: imageURL, Filename: filename, Success: true, Message: "Image uploaded successfully",
		}, nil
	}
}

func optimizeProductImage(input io.ReadSeeker) ([]byte, string, string, error) {
	info, _, err := image.DecodeConfig(input)
	if err != nil || info.Width <= 0 || info.Height <= 0 {
		return nil, "", "", errors.New("could not decode image")
	}
	if max(info.Width, info.Height) > 12_000 || info.Width > maxImagePixels/info.Height {
		return nil, "", "", errors.New("choose an image up to 24 megapixels and 12,000 pixels per side")
	}
	if _, err := input.Seek(0, io.SeekStart); err != nil {
		return nil, "", "", errors.New("could not read image")
	}
	img, err := imaging.Decode(input, imaging.AutoOrientation(true))
	if err != nil {
		return nil, "", "", errors.New("could not decode image")
	}
	img = imaging.Fit(img, maxImageSide, maxImageSide, imaging.Lanczos)

	var encoded bytes.Buffer
	opaque, known := img.(interface{ Opaque() bool })
	if known && opaque.Opaque() {
		if err := jpeg.Encode(&encoded, img, &jpeg.Options{Quality: 82}); err != nil {
			return nil, "", "", errors.New("could not encode image")
		}
		return encoded.Bytes(), "image/jpeg", ".jpg", nil
	}
	if err := png.Encode(&encoded, img); err != nil {
		return nil, "", "", errors.New("could not encode image")
	}
	return encoded.Bytes(), "image/png", ".png", nil
}
