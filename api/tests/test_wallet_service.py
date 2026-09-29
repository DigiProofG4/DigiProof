import unittest

from app.models import Role, User
from app.services.wallets import WalletService

# Public BIP-39 test vector seed; never fund these addresses.
TEST_MNEMONIC = "test test test test test test test test test test test junk"


def make_service(mnemonic: str = TEST_MNEMONIC) -> WalletService:
    service = WalletService()
    service.mnemonic = mnemonic
    return service


class WalletServiceTests(unittest.TestCase):
    def test_customer_gets_a_deterministic_address(self):
        service = make_service()
        user = User(id=2, email="buyer@example.com", role=Role.CUSTOMER)

        address = service.ensure_wallet(user)

        self.assertEqual(address, user.wallet_address)
        self.assertTrue(address.startswith("0x") and len(address) == 42)
        self.assertEqual(address, service.account_for(2).address)
        self.assertEqual(service.derived_account(user).address, address)

    def test_each_user_gets_a_different_address(self):
        service = make_service()
        self.assertNotEqual(service.account_for(2).address, service.account_for(3).address)

    def test_retailers_do_not_get_a_wallet(self):
        user = User(id=1, email="shop@example.com", role=Role.RETAILER)
        self.assertIsNone(make_service().ensure_wallet(user))
        self.assertIsNone(user.wallet_address)
        self.assertIsNone(make_service().derived_account(user))

    def test_existing_address_is_kept(self):
        user = User(id=5, email="own@example.com", role=Role.CUSTOMER, wallet_address="0x" + "ab" * 20)
        service = make_service()

        self.assertEqual(service.ensure_wallet(user), "0x" + "ab" * 20)
        # The generated wallet is still reachable for tokens minted before the switch.
        self.assertEqual(service.derived_account(user).address, service.account_for(5).address)

    def test_no_mnemonic_means_no_wallet(self):
        user = User(id=2, email="buyer@example.com", role=Role.CUSTOMER)
        self.assertIsNone(make_service("").ensure_wallet(user))


if __name__ == "__main__":
    unittest.main()
