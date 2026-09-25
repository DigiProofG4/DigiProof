import unittest

from app.services.blockchain import BlockchainService


class BlockchainServiceTests(unittest.TestCase):
    def test_stub_mode_returns_hash_like_result(self):
        service = BlockchainService()
        service.rpc_url = ""
        service.contract_address = ""
        service.custodial_wallet_key = ""

        result = service.mint_warranty(
            serial_number="ABC123",
            owner_email="buyer@example.com",
            metadata={"uri": "ipfs://demo/1"},
        )

        self.assertTrue(result.token_id)
        self.assertTrue(result.tx_hash.startswith("0x"))
        self.assertTrue(result.metadata_uri.startswith("ipfs://") or result.metadata_uri.startswith("ipfs://placeholder/"))

    def test_live_mode_requires_rpc_contract_and_private_key(self):
        service = BlockchainService()
        service.rpc_url = "http://localhost:8545"
        service.contract_address = "0x0000000000000000000000000000000000000001"
        service.custodial_wallet_key = ""

        self.assertFalse(service.is_live)

        service.custodial_wallet_key = "0x" + "11" * 32
        self.assertTrue(service.is_live)


if __name__ == "__main__":
    unittest.main()
