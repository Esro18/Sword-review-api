const express = require("express");
const path = require("path");
const axios = require("axios");
const { createCanvas, loadImage, GlobalFonts } = require("@napi-rs/canvas");

const app = express();

try {
    GlobalFonts.registerFromPath(path.join(process.cwd(), "Arial.ttf"), "Arial");
} catch (e) {
    console.log("No Arial.ttf found, using default font.");
}

app.get("/review", async (req, res) => {
    try {
        const { avatar, username, text } = req.query;
        if (!avatar || !username || !text) {
            return res.status(400).send("Missing avatar, username or text");
        }

        const bgPath = path.join(process.cwd(), "review-bg.png");
        const bg = await loadImage(bgPath);

        const canvas = createCanvas(bg.width, bg.height);
        const ctx = canvas.getContext("2d");

        ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);

        // 🟣 الأفاتار داخل الدائرة بدقة
        const avatarResp = await axios.get(avatar, { responseType: "arraybuffer" });
        const avatarImg = await loadImage(avatarResp.data);

        const avatarCenterX = 160; // موقع الدائرة مضبوط
        const avatarCenterY = 160;
        const avatarRadius = 60;

        ctx.save();
        ctx.beginPath();
        ctx.arc(avatarCenterX, avatarCenterY, avatarRadius, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(
            avatarImg,
            avatarCenterX - avatarRadius,
            avatarCenterY - avatarRadius,
            avatarRadius * 2,
            avatarRadius * 2
        );
        ctx.restore();

        // 🟦 الاسم داخل المربع الصغير بجانب الدائرة
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 28px Arial";
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText(username, avatarCenterX + avatarRadius + 40, avatarCenterY);

        // 🟪 نص التقييم داخل المربع الكبير بالمنتصف
        ctx.font = "bold 42px Arial";
        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.direction = "rtl"; // عشان العربي يطلع صح

        const centerX = canvas.width / 2;
        const centerY = 520;
        wrapTextCentered(ctx, text, centerX, centerY, 700, 55);

        const buffer = canvas.toBuffer("image/png");
        res.setHeader("Content-Type", "image/png");
        return res.send(buffer);
    } catch (err) {
        console.error(err);
        return res.status(500).send("Internal Server Error");
    }
});

function wrapTextCentered(ctx, text, centerX, centerY, maxWidth, lineHeight) {
    const words = text.split(" ");
    let line = "";
    const lines = [];
    for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + " ";
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && n > 0) {
            lines.push(line);
            line = words[n] + " ";
        } else {
            line = testLine;
        }
    }
    lines.push(line);

    const totalHeight = lines.length * lineHeight;
    let y = centerY - totalHeight / 2;

    for (let i = 0; i < lines.length; i++) {
        ctx.fillText(lines[i].trim(), centerX, y);
        y += lineHeight;
    }
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API running on port ${PORT}`));
// =====================================================
// ====================== النهاية ========================
// =====================================================

// تم بناء هذا النظام بالكامل بواسطة:
// Sword review-api — Discord Bot
// جميع الحقوق محفوظة لدى Esro Store ❤️