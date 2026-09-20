"""Steps 4-5 in the architecture diagram: upload warranty metadata to IPFS,
get back a CID, hand that to the Blockchain Service as the token's URI.

Stubbed for now, same pattern as blockchain.py: returns a believable fake CID
so the rest of the flow (mint, DB write, notification) can be built and
demoed before real IPFS credentials exist.
"""

from __future__ import annotations

import hashlib
import json
from dataclasses import dataclass

from app.config import settings


@dataclass
class PinResult:
    cid: str
    uri: str


class StorageService:
    def __init__(self) -> None:
        # Later: an API key/JWT for a pinning service (Pinata, web3.storage, …)
        # or a local IPFS node's API URL.
        self.is_live = False

    def upload_metadata(self, metadata: dict) -> PinResult:
        """Pin warranty metadata (product, retailer, dates, terms) to IPFS.

        TODO (blockchain phase):
          call the pinning service's REST API with `metadata` as JSON,
          return the CID it hands back instead of the fake one below.
        """
        if self.is_live:
            raise NotImplementedError("Live IPFS pinning is not wired up yet")

        payload = json.dumps(metadata, sort_keys=True, default=str).encode()
        fake_cid = "bafy" + hashlib.sha256(payload).hexdigest()[:46]
        return PinResult(cid=fake_cid, uri=f"ipfs://{fake_cid}")


storage = StorageService()
