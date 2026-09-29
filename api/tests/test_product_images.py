import tempfile
import unittest
from pathlib import Path
from unittest import mock

from app.services import images

PNG_HEADER = b"\x89PNG\r\n\x1a\n" + b"\x00" * 16


class ProductImageTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        patcher = mock.patch.object(images, "PRODUCT_DIR", Path(self.tmp.name))
        patcher.start()
        self.addCleanup(patcher.stop)
        self.addCleanup(self.tmp.cleanup)

    def test_png_is_saved_under_a_random_name(self):
        url = images.save_product_image(PNG_HEADER)
        self.assertTrue(url.startswith("/uploads/products/") and url.endswith(".png"))
        self.assertTrue((Path(self.tmp.name) / Path(url).name).exists())

    def test_jpeg_and_webp_are_recognised(self):
        self.assertTrue(images.save_product_image(b"\xff\xd8\xff\xe0" + b"\x00" * 8).endswith(".jpg"))
        self.assertTrue(images.save_product_image(b"RIFF\x00\x00\x00\x00WEBPVP8 ").endswith(".webp"))

    def test_non_images_are_rejected(self):
        with self.assertRaises(images.ImageError):
            images.save_product_image(b"<svg onload=alert(1)>")
        with self.assertRaises(images.ImageError):
            images.save_product_image(b"")

    def test_oversized_files_are_rejected(self):
        with self.assertRaises(images.ImageError):
            images.save_product_image(PNG_HEADER + b"\x00" * images.MAX_BYTES)

    def test_delete_only_touches_our_uploads(self):
        url = images.save_product_image(PNG_HEADER)
        images.delete_product_image("https://example.com/photo.png")
        images.delete_product_image("/uploads/products/../../app/main.py")
        self.assertTrue((Path(self.tmp.name) / Path(url).name).exists())
        images.delete_product_image(url)
        self.assertFalse((Path(self.tmp.name) / Path(url).name).exists())


if __name__ == "__main__":
    unittest.main()
