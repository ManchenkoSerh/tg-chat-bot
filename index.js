const express = require('express')
const cors = require('cors')
const pino = require('pino');
const expressPino = require('express-pino-logger');
const { Bot } = require('tgapi')
const multer = require('multer');
const helmet = require('helmet');
const fs = require('fs')
const path = require('path');

const app = express()
const logger = pino({ level: 'info' });
const expressLogger = expressPino({ logger });
const port = process.env.PORT || 3333;
const bot = new Bot('1436481545:AAGH14yceC80CPlb12szxJ2vQ7xZTSBMVsA')
const chat_id = '-426861819'

app.use(helmet());
app.use(expressLogger);
app.use(cors())
app.use('/uploads', express.static(path.join(__dirname, '/uploads')));

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        if (!fs.existsSync('./uploads')) {
            fs.mkdirSync('./uploads')
        }
        cb(null, 'uploads');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const fileFilter = (req, file, cb) => {
    if (file.mimetype == 'image/jpeg' || file.mimetype == 'image/png') {
        cb(null, true);
    } else {
        req.fileValidationError = true;
        cb(null, false);
    }
}

const upload = multer({ storage: storage, fileFilter: fileFilter, limits: { fileSize: 5000000 } });

const unlinkFile = (path) => {
    fs.unlink(path, (err) => {
        if (err) throw err;
    })
}

app.post('/sendForm', upload.single('image'), async (req, res) => {
    if (req.fileValidationError) {
        return res.status(400).send('Form supports only jpeg and png files');
    }
    if (req.file) {
        const photo = fs.createReadStream(req.file.path)
        const caption = `firstname: ${req.body.firstName}\nlastname: ${req.body.lastName}`
        const sended = await bot.sendPhoto({ chat_id, photo, caption })
        logger.info(sended)
        if (sended.ok) {
            unlinkFile(req.file.path)
            res.status(200).end()
        } else {
            unlinkFile(req.file.path)
            res.status(sended.error_code).send(sended.description)
        }

    }

})

app.all('*', (req, res) => {
    res.status(404).send('Not Found')
})

app.listen(port, () => {
    console.log(`App starting at http://localhost:${port}`)
})