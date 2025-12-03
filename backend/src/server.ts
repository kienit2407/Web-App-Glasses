//==============Dependencies=====================
import express, { Express } from 'express'
import { env } from './config/environment'
import { API_ENTRYPOINT } from './routes/index'
import { errolHandlingMiddleware } from './middleware/errol_handling_middleware'
import { CONNECTDB, CLOSE_DB } from './config/mongoosedb'
import cors from 'cors'
import AsyncExitHook from 'async-exit-hook';
import cookieParser from 'cookie-parser'
import { CONNECT_REDIS, CLOSE_REDIS } from './config/redis'
import http from 'http'
import morgan from 'morgan'
import { INITIALIZE_SOCKET_IO } from './config/socket.io'
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import path from 'path'
//===================================

const app: Express = express()
const port: number = Number(process.env.PORT) || 8017

const START_SERVER = () => {
    // Chỉ tạo 1 server duy nhất
    const server = http.createServer(app)

    // Gắn socket.io vào chính server này
    INITIALIZE_SOCKET_IO(server)

    // Middlewares
    app.use(express.json({ limit: "4mb" }))
    app.use(cookieParser())
    app.use(express.urlencoded({ extended: true }))
    app.use(morgan('dev'))

    app.use(
        cors({
            origin: [
                'http://localhost:5173',
                'http://localhost:8017',
                'http://localhost:8080',
                'https://localhost:5173',
                'https://web-app-glasses-x57x.vercel.app',
            ],
            allowedHeaders: ["Content-Type", "Authorization", "x-client-platform"],
            credentials: true,
        })
    )
    // --- CẤU HÌNH SWAGGER ---
    const options = {
        definition: {
            openapi: '3.0.0',
            info: {
                title: 'Glasses E-commerce API',
                version: '1.0.0',
                description: 'Tài liệu API đầy đủ cho dự án Glasses',
            },
            servers: [
                {
                    url: `${process.env.URL_BACKEND || `http://localhost:${port}`}`,
                    description: 'Local server',
                },
            ],
            components: {
                securitySchemes: {
                    bearerAuth: {
                        type: 'http',
                        scheme: 'bearer',
                        bearerFormat: 'JWT',
                    },
                },
            },
        },
        // khi chạy bản build thì file là .js, không còn .ts
        apis: [
            path.join(__dirname, 'routes/*.js'),
            path.join(__dirname, 'routes/**/*.js'),
        ],
    };

    const specs = swaggerJsdoc(options);
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

    // --- SERVE FRONTEND BUILD (static files) ---
    // const clientBuildPath = path.join(process.cwd(), '../frontend_web/dist');
    // console.log('Serving frontend from:', clientBuildPath);
    const clientBuildPath = path.join(process.cwd(), 'client-dist');
    console.log('Serving frontend from:', clientBuildPath);

    // 1) serve file tĩnh (JS, CSS, image...)
    app.use(express.static(clientBuildPath));

    // 2) API routes
    app.use('/', API_ENTRYPOINT);

    // 3) Error handler CHO API
    app.use(errolHandlingMiddleware);

    // 4) SPA fallback (LUÔN LUÔN ĐỂ CUỐI CÙNG)
    app.get('*', (req, res) => {
        // giữ lại /api-docs hoặc các route khác nếu muốn
        if (req.path.startsWith('/api-docs')) {
            return res.status(404).send('Not found');
        }
        res.sendFile(path.join(clientBuildPath, 'index.html'));
    });
    app.use('/', API_ENTRYPOINT)
    app.use(errolHandlingMiddleware)

    // Listen bằng chính server đã gắn Socket.IO
    server.listen(port, () => {
        console.log(`Server running at ${port}`)
    })

    AsyncExitHook(() => {
        server.close(async () => {
            console.log('\nHTTP server closed.')
            try {
                console.log("6. DISCONNECTING TO MONGODB....")
                CLOSE_DB()
                console.log("7. DISCONECTTED TO MONGDB")
                CLOSE_REDIS()
                console.log("8. DISCONECTTED REDIS")
            } catch (err) {
                console.error('Error during DB disconnect:', err)
                process.exit(0)
            }
        })
    })
}

    // KHỞI TẠO CONNECT FOR DB
    ; (async (): Promise<void> => {
        try {
            console.log("1. CONNECTING TO MONGODB....")
            await CONNECTDB()
            console.log("2. CONECTTED TO MONGDB")

            console.log("3. CONNECTING TO REDIS....")
            await CONNECT_REDIS()
            console.log("4. CONECTTED TO REDIS")

            START_SERVER()
            console.log("5. SERVER STARTED")
        } catch (error) {
            console.log("CONECTTED TO MONGDB occured a Error")
            console.error(error)
            process.exit(0)
        }
    })()
