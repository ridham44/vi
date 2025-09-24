require('dotenv').config();

// Get AuditLogger Config
const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/app/db/audit-logger/config.json')[env];
const express = require('express');
// const helmet = require('helmet');
const app = express();
const httpServer = require('http').Server(app);
const path = require('path');
const bodyParser = require('body-parser');
const db = require('./app/db/models');
const cors = require('cors');
const compression = require('compression');
const fs = require('fs');
const { createNamespace } = require('cls-hooked');

//* Swagger Docs
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./docs/swagger.json');
var morgan = require('morgan');
const { responseOverwrite } = require('./app/db/audit-logger/utils');

//* App Route Versions
const V1Routes = '/api/v1';

//* Middlewares */
const cookieParser = require('cookie-parser');
app.use(cookieParser());

//* Creating Context Namespace - session.
//? If you need to change the namespace name. Make sure to also update in middleware.js and models/index.js
createNamespace(config.clsNamespace);

//* CRON Jobs
// require('./schedule');

// Time when request started
app.use((req, res, next) => {
    req.startTime = performance.now();
    next();
});

//For logging the time taken to process each request
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`${req.method} ${req.originalUrl} - ${duration}ms`);
    });
    next();
});

//* Response Compression
app.use(compression());

//* Helmet
// app.use(helmet());

//* Morgan

const accessLogs = fs.createWriteStream('./logs/access.log', { flags: 'a' });
app.use(morgan(':remote-addr [:date[web]] :method :url :status - :response-time ms', { stream: accessLogs }));

//* Body Parser Options
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(bodyParser.json({ limit: '50mb' }));

const allowedOrigins = ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:5173', 'https://videv.chplgroup.org'];

app.use(
    cors({
        origin: function (origin, callback) {
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                console.error('❌ Blocked by CORS:', origin);
                callback(new Error('CORS policy does not allow this origin'));
            }
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD'],
        allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization','Timezone'],
    })
);

// For checking incoming request and cookies
// app.use((req, res, next) => {
//     console.log('➡️ Incoming Request:', req.method, req.url);
//     console.log('Cookies Received:', req.headers.cookie);
//     next();
// });

// Handle OPTIONS preflight requests for all routes
app.options('*', cors());

//* Overwrite the default res.json method to enable API response tracking.
app.use(responseOverwrite);

// app.use(cors({ origin: true }));

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', req.headers.origin);
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET,HEAD,OPTIONS,POST,PUT,DELETE');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    next();
});

//* Checks if folders exist else create folders for static files
// let folders = ['uploads'];
// folders.forEach((f) => {
//     if (!fs.existsSync(f)) {
//         fs.mkdirSync(f);
//     }
// });

const folders = ['uploads', 'uploads/recording'];

folders.forEach((folder) => {
    if (!fs.existsSync(folder)) {
        fs.mkdirSync(folder, { recursive: true }); // recursive ensures parent folders are created if missing
        console.log(`Folder created: ${folder}`);
    }
});
//* Sequelize Connection and Sync
db.sequelize
    .authenticate()
    .then(() => {
        console.log('DB connected!');
    })
    .catch((err) => {
        console.error('DB connection failed!', err.message);
    });

// Middleware to force download for files in the /uploads/qrcodes directory
app.use('/uploads/qrcodes', (req, res, next) => {
    res.setHeader('Content-Disposition', `attachment; filename="${path.basename(req.url)}"`);
    next();
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

//* App Routes
app.use(V1Routes, require('./app/routes_controller'));

app.get('/', (req, res) => {
    return res.json({ message: 'Server running.' });
});

//* Swagger Routes
if (process.env.NODE_ENV !== 'production') {
    app.use('/api-docs', swaggerUi.serve);
    app.get('/api-docs', swaggerUi.setup(swaggerDocument));
}

//* Server
httpServer.listen(process.env.PORT || 5001, function () {
    console.log('Magic happens on :' + process.env.PORT);
});
