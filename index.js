const express = require("express");
const path = require("path");
const axios = require("axios");
const { createCanvas, loadImage, GlobalFonts } = require("@napi-rs/canvas");

const app = express();

// تسجيل الخط
try {
    GlobalFonts.registerFromPath(
        path.join(process.cwd(), "Arial.ttf"),
        "Arial"
    );
} catch (e) {
    console.log("No Arial.ttf found, using default font.");
}

app.get("/review", async (req, res) => {
    try {
        const { avatar, username, text } = req.query;

        if (!avatar || !username || !text) {
            return res
                .status(400)
                .send("Missing avatar, username or text");
        }

        // تحميل الخلفية
        const bgPath = path.join(process.cwd(), "review-bg.png");
        const bg = await loadImage(bgPath);

        // إنشاء Canvas بنفس أبعاد الخلفية
        const canvas = createCanvas(bg.width, bg.height);
        const ctx = canvas.getContext("2d");

        // رسم الخلفية
        ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);

        // ==================================================
        // 🟣 الأفاتار
        // ==================================================

        const avatarResp = await axios.get(avatar, {
            responseType: "arraybuffer",
        });

        const avatarImg = await loadImage(avatarResp.data);

        // مكان الدائرة
        const avatarCenterX = 205;
        const avatarCenterY = 245;
        const avatarRadius = 78;

        ctx.save();

        ctx.beginPath();
        ctx.arc(
            avatarCenterX,
            avatarCenterY,
            avatarRadius,
            0,
            Math.PI * 2
        );

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

        // ==================================================
        // 🟦 الاسم
        // ==================================================

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 38px Arial";
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";

        // قص الاسم إذا كان طويل
        let displayName = username;

        while (
            ctx.measureText(displayName).width > 330 &&
            displayName.length > 0
        ) {
            displayName = displayName.slice(0, -1);
        }

        if (displayName !== username) {
            displayName += "...";
        }

        // مكان الاسم
        ctx.fillText(displayName, 315, 245);

        // ==================================================
        // 🟪 نص التقييم
        // ==================================================

        ctx.font = "bold 54px Arial";
        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        const centerX = canvas.width / 2;
        const centerY = 545;

        wrapTextCentered(
            ctx,
            text,
            centerX,
            centerY,
            950,
            70
        );

        // ==================================================
        // ⭐ النجوم
        // ==================================================

        ctx.font = "bold 55px Arial";
        ctx.fillStyle = "#dba6ff";

        const stars = "★★★★★";

        ctx.textAlign = "left";
        ctx.fillText(stars, 95, 890);

        // ==================================================
        // إرسال الصورة
        // ==================================================

        const buffer = canvas.toBuffer("image/png");

        res.setHeader("Content-Type", "image/png");

        return res.send(buffer);

    } catch (err) {
        console.error(err);
        return res.status(500).send("Internal Server Error");
    }
});

// ==================================================
// دالة تقسيم النص
// ==================================================

function wrapTextCentered(
    ctx,
    text,
    centerX,
    centerY,
    maxWidth,
    lineHeight
) {
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

        ctx.fillText(
            lines[i].trim(),
            centerX,
            y
        );

        y += lineHeight;
    }
}

// ==================================================
// تشغيل السيرفر
// ==================================================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`API running on port ${PORT}`);
});
// =====================================================
// ====================== النهاية ========================
// =====================================================

// تم بناء هذا النظام بالكامل بواسطة:
// Sword review-api — Discord Bot
// جميع الحقوق محفوظة لدى Esro Store ❤️