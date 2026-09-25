"""Steps 4-5 in the architecture diagram: turn warranty metadata into a
token URI, hand that to the Blockchain Service to mint against.

Builds a self-contained data: URI (base64 JSON, with a generated SVG image
also inlined as a data: URI) instead of pinning to a real IPFS service.
Renders correctly in MetaMask/OpenSea with no external hosting or API key —
swap this for real pinning (Pinata, web3.storage, …) later if the metadata
needs to live outside the token itself.
"""

from __future__ import annotations

import base64
import hashlib
import json
from dataclasses import dataclass
from xml.sax.saxutils import escape

from app.config import settings


@dataclass
class PinResult:
    cid: str
    uri: str


def _certificate_svg(name: str, brand: str, serial_number: str) -> str:
    return (
        '<svg xmlns="http://www.w3.org/2000/svg" width="350" height="350">'
        '<rect width="100%" height="100%" fill="#4f46e5"/>'
        '<text x="24" y="48" font-family="sans-serif" font-size="22" font-weight="bold" fill="#ffffff">DigiProof</text>'
        f'<text x="24" y="180" font-family="sans-serif" font-size="18" fill="#ffffff">{escape(name)}</text>'
        f'<text x="24" y="206" font-family="sans-serif" font-size="13" fill="#c7d2fe">{escape(brand)}</text>'
        f'<text x="24" y="320" font-family="sans-serif" font-size="12" fill="#c7d2fe">S/N {escape(serial_number)}</text>'
        "</svg>"
    )


class StorageService:
    def __init__(self) -> None:
        # Later: an API key/JWT for a pinning service (Pinata, web3.storage, …)
        # or a local IPFS node's API URL.
        self.is_live = False

    def upload_metadata(self, metadata: dict) -> PinResult:
        """Build the token's metadata JSON (name, image, attributes) as a data: URI."""
        name = str(metadata.get("name") or "DigiProof Warranty")
        brand = str(metadata.get("brand") or "")
        serial_number = str(metadata.get("serial_number") or "")
        retailer = str(metadata.get("retailer") or "")

        svg = _certificate_svg(name, brand, serial_number)
        image_uri = "data:image/svg+xml;base64," + base64.b64encode(svg.encode()).decode()

        token_metadata = {
            "name": f"DigiProof Warranty — {name}",
            "description": f"Proof of purchase and warranty for {name} (S/N {serial_number}), issued by {retailer}.",
            "image": image_uri,
            "attributes": [
                {"trait_type": "Brand", "value": brand},
                {"trait_type": "Model", "value": str(metadata.get("model") or "")},
                {"trait_type": "Serial Number", "value": serial_number},
                {"trait_type": "Purchase Date", "value": str(metadata.get("purchase_date") or "")},
                {"trait_type": "Expires On", "value": str(metadata.get("expires_on") or "")},
            ],
        }

        payload = json.dumps(token_metadata, sort_keys=True).encode()
        uri = "data:application/json;base64," + base64.b64encode(payload).decode()
        fake_cid = "local:" + hashlib.sha256(payload).hexdigest()[:16]
        return PinResult(cid=fake_cid, uri=uri)


storage = StorageService()
