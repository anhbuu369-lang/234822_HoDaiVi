import { useEffect, useState } from 'react';
import axios from 'axios';
import './App.css';

const BASE_URL = (
    import.meta.env.VITE_API_URL ||
    'http://localhost:5000'
).replace(/\/+$/, '');

const API_URL = `${BASE_URL}/api/books`;

const initialForm = {
    bookId: '',
    title: '',
    author: '',
    category: '',
    publisher: '',
    publishYear: '',
    isbn: '',
    quantity: '',
    description: ''
};

function App() {
    const [books, setBooks] = useState([]);
    const [form, setForm] = useState(initialForm);
    const [editingId, setEditingId] = useState(null);

    const [search, setSearch] = useState('');

    const [loading, setLoading] = useState(false);

    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const [selectedBook, setSelectedBook] =
        useState(null);

    // ==========================
    // LOAD BOOKS
    // ==========================

    const fetchBooks = async (
        keyword = ''
    ) => {
        try {
            setLoading(true);
            setError('');

            const params = {};

            if (keyword.trim()) {
                params.search =
                    keyword.trim();
            }

            const response =
                await axios.get(
                    API_URL,
                    { params }
                );

            setBooks(response.data);

        } catch (err) {
            console.error(err);

            setError(
                'Không thể tải danh sách sách.'
            );

        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBooks();
    }, []);

    // ==========================
    // FORM
    // ==========================

    const handleChange = (e) => {
        const {
            name,
            value
        } = e.target;

        setForm(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // ==========================
    // ADD / UPDATE
    // ==========================

    const handleSubmit =
        async (e) => {

            e.preventDefault();

            setMessage('');
            setError('');

            const payload = {
                ...form,

                publishYear:
                    Number(
                        form.publishYear
                    ),

                quantity:
                    Number(
                        form.quantity
                    )
            };

            try {
                if (editingId) {

                    await axios.put(
                        `${API_URL}/${editingId}`,
                        payload
                    );

                    setMessage(
                        'Cập nhật sách thành công.'
                    );

                } else {

                    await axios.post(
                        API_URL,
                        payload
                    );

                    setMessage(
                        'Thêm sách thành công.'
                    );
                }

                setForm(initialForm);
                setEditingId(null);

                await fetchBooks(
                    search
                );

            } catch (err) {
                console.error(err);

                const apiMessage =
                    err.response
                        ?.data
                        ?.message;

                const apiErrors =
                    err.response
                        ?.data
                        ?.errors;

                if (
                    Array.isArray(
                        apiErrors
                    )
                ) {
                    setError(
                        apiErrors.join(', ')
                    );

                } else {
                    setError(
                        apiMessage ||
                        'Có lỗi xảy ra.'
                    );
                }
            }
        };

    // ==========================
    // EDIT
    // ==========================

    const handleEdit = (book) => {

        setEditingId(book._id);

        setForm({
            bookId:
                book.bookId || '',

            title:
                book.title || '',

            author:
                book.author || '',

            category:
                book.category || '',

            publisher:
                book.publisher || '',

            publishYear:
                book.publishYear || '',

            isbn:
                book.isbn || '',

            quantity:
                book.quantity ?? '',

            description:
                book.description || ''
        });

        setSelectedBook(null);

        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    // ==========================
    // DELETE
    // ==========================

    const handleDelete =
        async (book) => {

            const confirmed =
                window.confirm(
                    `Bạn có chắc muốn xóa "${book.title}"?`
                );

            if (!confirmed) {
                return;
            }

            try {
                await axios.delete(
                    `${API_URL}/${book._id}`
                );

                setMessage(
                    'Xóa sách thành công.'
                );

                setSelectedBook(null);

                await fetchBooks(
                    search
                );

            } catch (err) {
                console.error(err);

                setError(
                    err.response
                        ?.data
                        ?.message ||
                    'Không thể xóa sách.'
                );
            }
        };

    // ==========================
    // SEARCH
    // ==========================

    const handleSearch =
        async (e) => {

            e.preventDefault();

            await fetchBooks(
                search
            );
        };

    const resetSearch = async () => {
        setSearch('');
        await fetchBooks('');
    };

    // ==========================
    // CANCEL EDIT
    // ==========================

    const cancelEdit = () => {
        setEditingId(null);
        setForm(initialForm);
        setError('');
        setMessage('');
    };

    return (
        <div className="app">

            <header className="header">
                <div>
                    <h1>
                        📚 Book Management
                    </h1>

                    <p>
                        Hệ thống quản lý sách
                        trên nền tảng đám mây
                    </p>
                </div>

                <div className="student">
                    MSSV: 234822
                    <br />
                    HoDaiVi
                </div>
            </header>

            <main className="container">

                <section className="card">

                    <h2>
                        {editingId
                            ? 'Cập nhật sách'
                            : 'Thêm sách mới'}
                    </h2>

                    {message && (
                        <div className="success">
                            {message}
                        </div>
                    )}

                    {error && (
                        <div className="error">
                            {error}
                        </div>
                    )}

                    <form
                        className="book-form"
                        onSubmit={
                            handleSubmit
                        }
                    >

                        <div className="form-grid">

                            <input
                                name="bookId"
                                placeholder="Mã sách"
                                value={
                                    form.bookId
                                }
                                onChange={
                                    handleChange
                                }
                                required
                            />

                            <input
                                name="title"
                                placeholder="Tên sách"
                                value={
                                    form.title
                                }
                                onChange={
                                    handleChange
                                }
                                required
                            />

                            <input
                                name="author"
                                placeholder="Tác giả"
                                value={
                                    form.author
                                }
                                onChange={
                                    handleChange
                                }
                                required
                            />

                            <input
                                name="category"
                                placeholder="Thể loại"
                                value={
                                    form.category
                                }
                                onChange={
                                    handleChange
                                }
                                required
                            />

                            <input
                                name="publisher"
                                placeholder="Nhà xuất bản"
                                value={
                                    form.publisher
                                }
                                onChange={
                                    handleChange
                                }
                                required
                            />

                            <input
                                type="number"
                                name="publishYear"
                                placeholder="Năm xuất bản"
                                value={
                                    form.publishYear
                                }
                                onChange={
                                    handleChange
                                }
                                required
                            />

                            <input
                                name="isbn"
                                placeholder="ISBN"
                                value={
                                    form.isbn
                                }
                                onChange={
                                    handleChange
                                }
                                required
                            />

                            <input
                                type="number"
                                min="0"
                                name="quantity"
                                placeholder="Số lượng"
                                value={
                                    form.quantity
                                }
                                onChange={
                                    handleChange
                                }
                                required
                            />

                        </div>

                        <textarea
                            name="description"
                            placeholder="Mô tả sách"
                            rows="4"
                            value={
                                form.description
                            }
                            onChange={
                                handleChange
                            }
                        />

                        <div className="form-actions">

                            <button
                                type="submit"
                                className="btn primary"
                            >
                                {editingId
                                    ? 'Lưu cập nhật'
                                    : 'Thêm sách'}
                            </button>

                            {editingId && (
                                <button
                                    type="button"
                                    className="btn secondary"
                                    onClick={
                                        cancelEdit
                                    }
                                >
                                    Hủy
                                </button>
                            )}

                        </div>

                    </form>

                </section>

                <section className="card">

                    <div className="toolbar">

                        <h2>
                            Danh sách sách
                        </h2>

                        <form
                            className="search-form"
                            onSubmit={
                                handleSearch
                            }
                        >

                            <input
                                placeholder="Tìm theo tên, tác giả, thể loại..."
                                value={search}
                                onChange={(e) =>
                                    setSearch(
                                        e.target.value
                                    )
                                }
                            />

                            <button
                                className="btn primary"
                                type="submit"
                            >
                                Tìm kiếm
                            </button>

                            <button
                                className="btn secondary"
                                type="button"
                                onClick={
                                    resetSearch
                                }
                            >
                                Tất cả
                            </button>

                        </form>

                    </div>

                    {loading ? (

                        <p>
                            Đang tải dữ liệu...
                        </p>

                    ) : books.length === 0 ? (

                        <p>
                            Không có sách.
                        </p>

                    ) : (

                        <div className="table-wrapper">

                            <table>

                                <thead>
                                    <tr>
                                        <th>
                                            Mã sách
                                        </th>
                                        <th>
                                            Tên sách
                                        </th>
                                        <th>
                                            Tác giả
                                        </th>
                                        <th>
                                            Thể loại
                                        </th>
                                        <th>
                                            Năm
                                        </th>
                                        <th>
                                            SL
                                        </th>
                                        <th>
                                            Thao tác
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>

                                    {books.map(
                                        (book) => (

                                            <tr
                                                key={
                                                    book._id
                                                }
                                            >

                                                <td>
                                                    {
                                                        book.bookId
                                                    }
                                                </td>

                                                <td>
                                                    {
                                                        book.title
                                                    }
                                                </td>

                                                <td>
                                                    {
                                                        book.author
                                                    }
                                                </td>

                                                <td>
                                                    {
                                                        book.category
                                                    }
                                                </td>

                                                <td>
                                                    {
                                                        book.publishYear
                                                    }
                                                </td>

                                                <td>
                                                    {
                                                        book.quantity
                                                    }
                                                </td>

                                                <td className="actions">

                                                    <button
                                                        className="btn info"
                                                        onClick={() =>
                                                            setSelectedBook(
                                                                book
                                                            )
                                                        }
                                                    >
                                                        Chi tiết
                                                    </button>

                                                    <button
                                                        className="btn warning"
                                                        onClick={() =>
                                                            handleEdit(
                                                                book
                                                            )
                                                        }
                                                    >
                                                        Sửa
                                                    </button>

                                                    <button
                                                        className="btn danger"
                                                        onClick={() =>
                                                            handleDelete(
                                                                book
                                                            )
                                                        }
                                                    >
                                                        Xóa
                                                    </button>

                                                </td>

                                            </tr>

                                        )
                                    )}

                                </tbody>

                            </table>

                        </div>
                    )}

                </section>

                {selectedBook && (

                    <section className="card detail">

                        <div className="detail-header">

                            <h2>
                                Chi tiết sách
                            </h2>

                            <button
                                className="close"
                                onClick={() =>
                                    setSelectedBook(
                                        null
                                    )
                                }
                            >
                                ×
                            </button>

                        </div>

                        <div className="detail-grid">

                            <p>
                                <strong>
                                    Mã sách:
                                </strong>{' '}
                                {
                                    selectedBook.bookId
                                }
                            </p>

                            <p>
                                <strong>
                                    Tên sách:
                                </strong>{' '}
                                {
                                    selectedBook.title
                                }
                            </p>

                            <p>
                                <strong>
                                    Tác giả:
                                </strong>{' '}
                                {
                                    selectedBook.author
                                }
                            </p>

                            <p>
                                <strong>
                                    Thể loại:
                                </strong>{' '}
                                {
                                    selectedBook.category
                                }
                            </p>

                            <p>
                                <strong>
                                    Nhà xuất bản:
                                </strong>{' '}
                                {
                                    selectedBook.publisher
                                }
                            </p>

                            <p>
                                <strong>
                                    Năm xuất bản:
                                </strong>{' '}
                                {
                                    selectedBook.publishYear
                                }
                            </p>

                            <p>
                                <strong>
                                    ISBN:
                                </strong>{' '}
                                {
                                    selectedBook.isbn
                                }
                            </p>

                            <p>
                                <strong>
                                    Số lượng:
                                </strong>{' '}
                                {
                                    selectedBook.quantity
                                }
                            </p>

                        </div>

                        <p>
                            <strong>
                                Mô tả:
                            </strong>{' '}
                            {
                                selectedBook.description ||
                                'Không có mô tả'
                            }
                        </p>

                    </section>

                )}

            </main>

            <footer>
                234822 - HoDaiVi
                | Cloud Computing
            </footer>

        </div>
    );
}

export default App;