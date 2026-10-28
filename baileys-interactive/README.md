# Julzaexce Baileys

<p align="center">
  <img src="https://julzaexce.my.id/julz-md-1793174456434.jpg" width="450" style="border-radius:12px; box-shadow: 0 4px 8px rgba(0,0,0,0.2);" alt="Julzaexce Baileys">
</p>

<p align="center">
  <strong>Baileys 7.0.0-rc14 with stable connection and interactive buttons that actually show up</strong><br>
  <sub>Same API, same connection, plus buttons, lists, and LID-to-number resolver</sub>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-v20+-green?style=for-the-badge&logo=node.js" alt="Node.js">
  <img src="https://img.shields.io/badge/Based%20on-Baileys%207.0.0--rc14-blue?style=for-the-badge" alt="Baileys">
  <img src="https://img.shields.io/badge/Module-ESM%20only-orange?style=for-the-badge" alt="ESM">
  <img src="https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge" alt="License">
</p>

---

## Description

**Julzaexce Baileys** is a WhatsApp Web library based on Baileys `7.0.0-rc14`, modified to fully support buttons and interactive messages. Native flow buttons, list menus, and buttons with media can be sent through `sendMessage` and actually render in WhatsApp.

Connection, login, session, and message delivery are built on the original Baileys foundation, so all core Baileys features keep running stable.

---

## Features

* **Stable WhatsApp Web Connection**
* **Multi-Device Support**
* **QR Code & Pairing Code Login**
* **Session Management**
* **Auto Reconnect**
* **Send Text, Image, Video, Audio, Document, Sticker, Contact, and Location**
* **Reply / Quote Message**
* **Receive Messages & Events**
* **Status Receipt (Delivered, Read, Played)**
* **Group Support & Mention**
* **Presence & Typing**
* **Native Flow Buttons**
* **List Menu (Single Select)**
* **Buttons with Media**
* **LID/JID to Number and Name Resolver**
* **ESM Only**

---

## Installation

From GitHub:
```bash
npm install github:julzkeceabiez/julzaexce-baileys
```

As a drop-in replacement without changing existing bot code (import name stays `@whiskeysockets/baileys`):
```json
{
  "dependencies": {
    "@whiskeysockets/baileys": "github:julzkeceabiez/julzaexce-baileys"
  }
}
```
The `lib/` folder is already included in the repo, so there's no build step during install. Make sure `git` is installed on your server or panel, since npm needs git to fetch packages from GitHub.

---

## Contact & Developer Information
* **Developer**: Julz
* **TikTok**: [@mangjulz](https://www.tiktok.com/@mangjulz)
* **Instagram**: [@julzz_x_](https://www.instagram.com/julzz_x_/)
* **WhatsApp**: [+62 815-4750-8744](https://wa.me/6281547508744)