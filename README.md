# Liaotian 聊天
easy-to-host social platforms for everyone

```
Current version: 1.0.9F
```

### What makes LiaoTian (LT) so special from already existing social media/networking platforms?

This is a project where **anyone can easily fork/clone and deploy their own** versions of this platform. This GitHub repository provides a sort of boilerplate template for making your own such platforms, in a way.
Unlike Mastodon and other open-source and decentralized or fediverse alternatives like this, the code is **compiled into a static site**, meaning it can be easily **hosted on most free hosting providers** for $0. All it needs is a database connection via Supabase. The content **behaves as if it is dynamic and real-time**, thanks to both Vercel (as what we have used) and Supabase's real-time API features.
Also to get started on developing your own version of LiaoTian, it's much simpler than most other "templates" out there, since it uses **only 18 files** for its actual codebase (as of now).

## 👤 Use LiaoTian itself
If you just want to create an account on **Liaoverse** (our official deployment) then [sign up here](https://liaoverse.xyz/).

## 🌐 Host your own LiaoTian
1. Fork this repository to your GitHub account.
2. Connect this repository to your Vercel account.
3. Create a Supabase database.
4. Insert the environment variables `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` on **Vercel** according to your **Supabase** API connection system (choose App:NextJS). Also need `VITE_TENOR_API_KEY` from [**Google Developer Console**](https://developers.google.com/tenor/guides/quickstart) for allowing sending GIFs.
5. If all steps are correct, you should be able to see your own instance of LiaoTian ready and deployed! Have fun customizing it to your needs.

## 🎨 Customization options
1. Currently, the following features can be customized by inserting/modifying the following environment vaiables on your deployment (e.g. Vercel):
   - **`VITE_FOLLOW_ONLY_FEED`** = `true` (will show only followed users' posts in the feed), `false` or missing (will show all posts from all users)
2. Also you can modify `src/index.css` to customize the color palettes and themes to your wish.

## 💎 Current features

- [x] Post on the feed and customize profiles like X/Twitter
- [x] Messaging like Telegram/WhatsApp
- [x] User following/followers
- [x] User profiles via url parameters (e.g. [/?liaotian](https://liaoverse.xyz/?liaotian))
- [x] Animated GIFs eligible for profile customization
- [x] Upload files (max 10 MB)
- [x] Upload images, videos, documents (txt, pdf, doc/x)
- [x] User settings (to change username, email, password, etc.)
- [x] User verification requests
- [x] Custom themes
- [x] Custom pages/sections
- [x] Deleting own posts from profile, via 3-dots context menu per post
- [x] Replying to messages
- [x] Online status green dots
- [x] Host audio and video calls
- [x] Comments and replies on posts (in a comment modal)
- [x] Multiple tabs on Profile for posts, media, and likes. Media tab is in a classic *Instagram*-like grid.
- [x] Multiple tabs on Feed for posts and shots ("shorts/"reels") in *TikTok*-like swipe navigation UI.
- [x] Platform data statistics page (accessible on [/stats](https://liaoverse.xyz/stats))
- [x] Voice messages
- [x] Web visitor analytics via Vercel
- [x] Posting on Status (similar to FB/IG story) + view detecting and replying via Messages logic
- [x] Status archive
- [x] custom SVG loading animations
- [x] Notification system (with "clear all" button to easily clear from database, too)
- [x] Message read receipts (checkmarks)
- [x] Groupchat functionality with 2 modes - singular channel (like WhatsApp, Messenger, Telegram) or multi channel (like Discord, Slack, Matrix).
- [x] Reactions for messages
- [x] Paste from clipboard to messages
- [x] Public post sharing via context menu
- [x] Gazebo joining Welcome page
- [x] Embed links (in Feed, Messages, Gazebos) and YouTube videos (in Feed)
- [x] Create and manage groups
- [x] Custom ringtone for calling in Messages
- [x] Special event/party mode (activated via App.tsx)
- [x] Sending GIFs via Tenor (in Messages only)
- [ ] Posting long-form content, e.g. blogs
- [ ] Hashtags
- [ ] Custom sounds, e.g. notifications, clicks, etc.
- [ ] Privacy settings for posts + "emergency profile shutdown" option to temporarily make only posts have "only me" level privacy.
- [ ] Add Discord-like activity detection for desktop client by identifying window titles or otherwise, for showing what game users are currently playing, etc.
- [ ] Add more sidebars for navigation to further secondary sections (Discover, Groups, Users, Trends).
- [ ] Link-in-bio builder
- [ ] Live streaming (from story? like early IG?)


## 🚨 Current flaws
- [ ] Cookie “__cf_bm” has been rejected for invalid domain. Browser console error logs sometimes.
- [ ] audio and video calling may require a turn server
- [ ] Current App.tsx URL param handling messes up non-conventional usernames (previous versions allowed them)
- [ ] Gazebo VC video and screen sharing issues (local works fine)
- [ ] Status images not centered properly, and sometimes trimmed in half
- [ ] Groups need better UI/UX for modification, post flairs in feed, etc.
- [ ] Forums need better UI/UX and allow media attachments

---

## ⚖️ Legal information
[LiaoTian](https://github.com/huanmux/liaotian) is a digital product brand/project by [Mux ZiZhiZhe Co.](https://mux8.com/zzz) under [HuanMux](https://www.linkedin.com/company/huanmux).

- [[📄 Terms of Service]](public/pages/terms-of-service.md) 
- [[📄 Privacy Policy]](public/pages/privacy-policy.md)

By cloning this repository and hosting/working on your own instance, you agree NOT to re-use the same brand name "LiaoTian"/"Liaoverse" or any of the identifying features (e.g. logo, wordmark, etc.) for very obvious reasons (e.g. misrepresentation). If you wish to create your own social platform using this template, you must customize your own version with your own unique product name, icon/logo, tagline, etc.
