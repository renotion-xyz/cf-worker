# Renotion Worker

This Cloudflare Worker allows to wrap a publicly shared Notion Page, and make it accessible using a custom domain name.

It simply can wrap `https://example.notion.site/My-Page-abc123def456..` and make it available at `example.com`.

## web3

The worker is universal, i.e. it can wrap any page for any domain.

Cloudflare only allows to do that for Custom SSL in their SaaS paid package.

I was playing around with web3 tech and build a [Smart Contract](https://github.com/renotion-xyz/contracts),
which allows you to register a Notion page with an associated domain on the blockchain.

The worker will then read and serve pages based on what is stored on the blockchain.

## Notes

Full project source code is availabe here: https://github.com/renotion-xyz

The project dApp: https://renotion.xyz/

---

This project was heavily inspired by https://github.com/stephenou/fruitionsite
