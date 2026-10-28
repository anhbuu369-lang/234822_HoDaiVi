const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dns = require('dns');
require('dotenv').config();

// ======================================================
// DNS CONFIG
// Fix lỗi querySrv ECONNREFUSED khi Node.js kết nối Atlas
// ======================================================

dns.setServers([
    '8.8.8.8',
    '1.1.1.1'
]);

const app = express();
const PORT = process.env.PORT || 5000;

// ======================================================
// CORS
// ======================================================

const allowedOrigins = [
    process.env.CLIENT_URL,
    'http://localhost:5173',
    'http://localhost:3000'
].filter(Boolean);

app.use(cors({
    origin: function (origin, callback) {
        // Cho phép request không có Origin như Postman, curl...
        if (!origin) {
            return callback(null, true);
        }

        // Development: cho phép tất cả origin
        if (process.env.NODE_ENV !== 'production') {
            return callback(null, true);
        }

        // Production: chỉ cho phép frontend đã khai báo
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        return callback(
            new Error(`CORS blocked: ${origin}`)
        );
    },
    credentials: true
}));

app.use(express.json());

// ======================================================
// REQUEST LOGGER
// ======================================================

app.use((req, res, next) => {
    console.log(`${req.method} ${req.originalUrl}`);
    next();
});

// ======================================================
// MONGODB CONNECTION
// ======================================================

async function connectDatabase() {
    if (!process.env.MONGODB_URI) {
        console.error(
            '❌ MONGODB_URI chưa được cấu hình trong file .env'
        );
        return;
    }

    try {
        await mongoose.connect(
            process.env.MONGODB_URI,
            {
                serverSelectionTimeoutMS: 15000
            }
        );

        console.log(
            '✅ MongoDB Atlas connected successfully'
        );

        console.log(
            `Database: ${mongoose.connection.name}`
        );

    } catch (error) {
        console.error(
            '❌ MongoDB connection error:',
            error.message
        );

        if (
            error.code === 'ECONNREFUSED' ||
            error.message.includes('ECONNREFUSED')
        ) {
            console.error(
                'Gợi ý: kiểm tra DNS, Internet và MongoDB Atlas Network Access.'
            );
        }
    }
}

// Gọi hàm kết nối MongoDB
connectDatabase();

// ======================================================
// BOOK SCHEMA
// ======================================================

const bookSchema = new mongoose.Schema(
    {
        bookId: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },

        title: {
            type: String,
            required: true,
            trim: true
        },

        author: {
            type: String,
            required: true,
            trim: true
        },

        category: {
            type: String,
            required: true,
            trim: true
        },

        publisher: {
            type: String,
            required: true,
            trim: true
        },

        publishYear: {
            type: Number,
            required: true
        },

        isbn: {
            type: String,
            required: true,
            trim: true
        },

        quantity: {
            type: Number,
            required: true,
            min: 0
        },

        description: {
            type: String,
            default: ''
        }
    },
    {
        timestamps: true
    }
);

const Book = mongoose.model(
    'Book',
    bookSchema
);

// ======================================================
// VALIDATION
// ======================================================

function validateBook(data) {
    const errors = [];

    if (!data.bookId?.trim()) {
        errors.push(
            'Mã sách không được để trống'
        );
    }

    if (!data.title?.trim()) {
        errors.push(
            'Tên sách không được để trống'
        );
    }

    if (!data.author?.trim()) {
        errors.push(
            'Tác giả không được để trống'
        );
    }

    if (!data.category?.trim()) {
        errors.push(
            'Thể loại không được để trống'
        );
    }

    if (!data.publisher?.trim()) {
        errors.push(
            'Nhà xuất bản không được để trống'
        );
    }

    if (!data.isbn?.trim()) {
        errors.push(
            'ISBN không được để trống'
        );
    }

    const publishYear =
        Number(data.publishYear);

    if (
        !Number.isInteger(publishYear) ||
        publishYear < 1000 ||
        publishYear >
            new Date().getFullYear() + 1
    ) {
        errors.push(
            'Năm xuất bản không hợp lệ'
        );
    }

    const quantity =
        Number(data.quantity);

    if (
        !Number.isInteger(quantity) ||
        quantity < 0
    ) {
        errors.push(
            'Số lượng phải là số nguyên không âm'
        );
    }

    return errors;
}

// ======================================================
// ROOT
// ======================================================

app.get('/', (req, res) => {
    res.status(200).json({
        message:
            'Book Management API - 234822 HoDaiVi',
        health: '/health',
        books: '/api/books'
    });
});

// ======================================================
// HEALTH CHECK
// ======================================================

app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',

        message:
            'Book Management API is running',

        database:
            mongoose.connection.readyState === 1
                ? 'connected'
                : 'disconnected',

        timestamp:
            new Date().toISOString()
    });
});

// ======================================================
// GET ALL BOOKS + SEARCH
//
// GET /api/books
// GET /api/books?search=cloud
//
// ======================================================

app.get(
    '/api/books',
    async (req, res) => {
        try {
            const search =
                (
                    req.query.search || ''
                ).trim();

            let filter = {};

            if (search) {
                const escapedSearch =
                    search.replace(
                        /[.*+?^${}()|[\]\\]/g,
                        '\\$&'
                    );

                const regex =
                    new RegExp(
                        escapedSearch,
                        'i'
                    );

                filter = {
                    $or: [
                        { title: regex },
                        { author: regex },
                        { category: regex },
                        { publisher: regex },
                        { bookId: regex },
                        { isbn: regex }
                    ]
                };
            }

            const books =
                await Book
                    .find(filter)
                    .sort({
                        createdAt: -1
                    });

            res.status(200).json(
                books
            );

        } catch (error) {
            console.error(
                'GET books error:',
                error.message
            );

            res.status(500).json({
                message:
                    'Không thể lấy danh sách sách',

                error:
                    error.message
            });
        }
    }
);

// ======================================================
// GET ONE BOOK
//
// Có thể tìm bằng MongoDB _id
// hoặc bookId như BK001
//
// ======================================================

app.get(
    '/api/books/:id',
    async (req, res) => {
        try {
            const id =
                req.params.id;

            let book = null;

            if (
                mongoose.Types
                    .ObjectId
                    .isValid(id)
            ) {
                book =
                    await Book.findById(
                        id
                    );
            }

            if (!book) {
                book =
                    await Book.findOne({
                        bookId: id
                    });
            }

            if (!book) {
                return res
                    .status(404)
                    .json({
                        message:
                            'Không tìm thấy sách'
                    });
            }

            res.status(200).json(
                book
            );

        } catch (error) {
            res.status(500).json({
                message:
                    'Không thể lấy thông tin sách',

                error:
                    error.message
            });
        }
    }
);

// ======================================================
// POST - ADD BOOK
// ======================================================

app.post(
    '/api/books',
    async (req, res) => {
        try {
            const errors =
                validateBook(
                    req.body
                );

            if (
                errors.length > 0
            ) {
                return res
                    .status(400)
                    .json({
                        message:
                            'Dữ liệu không hợp lệ',

                        errors
                    });
            }

            const normalizedBookId =
                req.body.bookId.trim();

            const exists =
                await Book.findOne({
                    bookId:
                        normalizedBookId
                });

            if (exists) {
                return res
                    .status(409)
                    .json({
                        message:
                            'Mã sách bookId đã tồn tại'
                    });
            }

            const book =
                await Book.create({
                    bookId:
                        normalizedBookId,

                    title:
                        req.body
                            .title
                            .trim(),

                    author:
                        req.body
                            .author
                            .trim(),

                    category:
                        req.body
                            .category
                            .trim(),

                    publisher:
                        req.body
                            .publisher
                            .trim(),

                    publishYear:
                        Number(
                            req.body
                                .publishYear
                        ),

                    isbn:
                        req.body
                            .isbn
                            .trim(),

                    quantity:
                        Number(
                            req.body
                                .quantity
                        ),

                    description:
                        req.body
                            .description
                            ?.trim() || ''
                });

            res.status(201).json(
                book
            );

        } catch (error) {

            if (
                error.code === 11000
            ) {
                return res
                    .status(409)
                    .json({
                        message:
                            'Mã sách bookId đã tồn tại'
                    });
            }

            res.status(500).json({
                message:
                    'Không thể thêm sách',

                error:
                    error.message
            });
        }
    }
);

// ======================================================
// PUT - UPDATE BOOK
// ======================================================

app.put(
    '/api/books/:id',
    async (req, res) => {
        try {
            const errors =
                validateBook(
                    req.body
                );

            if (
                errors.length > 0
            ) {
                return res
                    .status(400)
                    .json({
                        message:
                            'Dữ liệu không hợp lệ',

                        errors
                    });
            }

            if (
                !mongoose.Types
                    .ObjectId
                    .isValid(
                        req.params.id
                    )
            ) {
                return res
                    .status(400)
                    .json({
                        message:
                            'ID sách không hợp lệ'
                    });
            }

            const currentBook =
                await Book.findById(
                    req.params.id
                );

            if (!currentBook) {
                return res
                    .status(404)
                    .json({
                        message:
                            'Không tìm thấy sách'
                    });
            }

            const duplicate =
                await Book.findOne({
                    bookId:
                        req.body
                            .bookId
                            .trim(),

                    _id: {
                        $ne:
                            req.params.id
                    }
                });

            if (duplicate) {
                return res
                    .status(409)
                    .json({
                        message:
                            'Mã sách bookId đã tồn tại'
                    });
            }

            const updatedBook =
                await Book
                    .findByIdAndUpdate(
                        req.params.id,

                        {
                            bookId:
                                req.body
                                    .bookId
                                    .trim(),

                            title:
                                req.body
                                    .title
                                    .trim(),

                            author:
                                req.body
                                    .author
                                    .trim(),

                            category:
                                req.body
                                    .category
                                    .trim(),

                            publisher:
                                req.body
                                    .publisher
                                    .trim(),

                            publishYear:
                                Number(
                                    req.body
                                        .publishYear
                                ),

                            isbn:
                                req.body
                                    .isbn
                                    .trim(),

                            quantity:
                                Number(
                                    req.body
                                        .quantity
                                ),

                            description:
                                req.body
                                    .description
                                    ?.trim() || ''
                        },

                        {
                            new: true,
                            runValidators: true
                        }
                    );

            res.status(200).json(
                updatedBook
            );

        } catch (error) {

            if (
                error.code === 11000
            ) {
                return res
                    .status(409)
                    .json({
                        message:
                            'Mã sách bookId đã tồn tại'
                    });
            }

            res.status(500).json({
                message:
                    'Không thể cập nhật sách',

                error:
                    error.message
            });
        }
    }
);

// ======================================================
// DELETE BOOK
// ======================================================

app.delete(
    '/api/books/:id',
    async (req, res) => {
        try {
            if (
                !mongoose.Types
                    .ObjectId
                    .isValid(
                        req.params.id
                    )
            ) {
                return res
                    .status(400)
                    .json({
                        message:
                            'ID sách không hợp lệ'
                    });
            }

            const deletedBook =
                await Book
                    .findByIdAndDelete(
                        req.params.id
                    );

            if (!deletedBook) {
                return res
                    .status(404)
                    .json({
                        message:
                            'Không tìm thấy sách'
                    });
            }

            res.status(200).json({
                message:
                    'Xóa sách thành công',

                deletedBook
            });

        } catch (error) {
            res.status(500).json({
                message:
                    'Không thể xóa sách',

                error:
                    error.message
            });
        }
    }
);

// ======================================================
// 404
// ======================================================

app.use((req, res) => {
    res.status(404).json({
        message:
            'API endpoint không tồn tại',

        path:
            req.originalUrl
    });
});

// ======================================================
// START SERVER
// ======================================================

app.listen(
    PORT,
    '0.0.0.0',
    () => {
        console.log(
            '===================================='
        );

        console.log(
            `Server đang chạy trên port ${PORT}`
        );

        console.log(
            `Environment: ${
                process.env.NODE_ENV ||
                'development'
            }`
        );

        console.log(
            'Health: /health'
        );

        console.log(
            'Books API: /api/books'
        );

        console.log(
            'DNS: Google + Cloudflare'
        );

        console.log(
            '===================================='
        );
    }
);