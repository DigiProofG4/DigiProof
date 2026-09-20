"""The Notification Service box in the architecture diagram: the app tells a
customer something happened (a warranty landed in their account, a transfer
completed) via the Email Service. Stubbed the same way as the other services
in this package — logs what would be sent instead of sending it, so the rest
of the app doesn't have to wait on real SMTP/SES credentials.
"""

from __future__ import annotations

import logging

logger = logging.getLogger("digiproof.notifications")


class NotificationService:
    def __init__(self) -> None:
        # Later: SMTP settings or an email API key (SES, Postmark, Resend, …)
        self.is_live = False

    def _send(self, to: str, subject: str, body: str) -> None:
        if self.is_live:
            raise NotImplementedError("Live email sending is not wired up yet")
        logger.info("EMAIL to=%s subject=%r body=%r", to, subject, body)

    def warranty_issued(self, *, to_email: str, product_name: str, expires_on: str) -> None:
        """Step 11 in the diagram: warranty now available in the customer's account."""
        self._send(
            to=to_email,
            subject=f"Your warranty for {product_name} is ready",
            body=(
                f"Your proof of purchase for {product_name} has been recorded and is now "
                f"in your DigiProof account. Cover runs until {expires_on}."
            ),
        )

    def ownership_transferred(self, *, to_email: str, product_name: str) -> None:
        """Sent to the new owner when a warranty is transferred to them."""
        self._send(
            to=to_email,
            subject=f"A warranty for {product_name} was transferred to you",
            body=(
                f"The proof of purchase for {product_name} has been transferred to your "
                f"DigiProof account. You can view it after signing in."
            ),
        )


notification = NotificationService()
