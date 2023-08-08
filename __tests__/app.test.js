process.env.NODE_ENV = "test";

const request = require("supertest");

const app = require("../app");
const db = require("../db");

let testBook

beforeEach(async function(){
    const result = await db.query(`INSERT INTO books VALUES (
                                    '4043226843',
                                    'http://test-book.org/not-a-real-book',
                                    'Jonathan Testington',
                                    'english',
                                    300,
                                    'Knowsmore Publishing',
                                    'Exhibit-A: Putting Your Best Foot Forward',
                                    2023) 
                                   RETURNING isbn, amazon_url, author, language, pages, publisher, title, year`);
    testBook = result.rows[0]
})

afterEach(async function(){
    await db.query("DELETE FROM books");
})

afterAll(async function() {
    await db.end();
});

describe('GET /books', () => {
    
    test('Gets an array of books', async () => {
        const resp = await request(app).get(`/books`);
        expect(resp.body).toEqual({books: [testBook]});
        expect(resp.statusCode).toEqual(200);
    });
});

describe('GET /books/:id', () => {
    
    test('Gets a single book', async () => {
        const resp = await request(app).get(`/books/${testBook.isbn}`);
        expect(resp.body).toEqual({book: testBook});
        expect(resp.statusCode).toEqual(200);
    });

    test('Returns 404 if book is not found', async () => {
        const resp = await request(app).get(`/books/0123456789`);
        expect(resp.statusCode).toEqual(404);
    });
});

describe('POST /books/', () => {
    
    test('Adds book to database and returns new book', async () => {
        const resp = await request(app).post(`/books`).send({
            "isbn": "0691161518",
            "amazon_url": "http://a.co/eobPtX2",
            "author": "Matthew Lane",
            "language": "english",
            "pages": 264,
            "publisher": "Princeton University Press",
            "title": "Power-Up: Unlocking the Hidden Mathematics in Video Games",
            "year": 2017
          });
        expect(resp.body).toEqual({book: {
            "isbn": "0691161518",
            "amazon_url": "http://a.co/eobPtX2",
            "author": "Matthew Lane",
            "language": "english",
            "pages": 264,
            "publisher": "Princeton University Press",
            "title": "Power-Up: Unlocking the Hidden Mathematics in Video Games",
            "year": 2017
          }});
        expect(resp.statusCode).toEqual(201);
    });

    test('Returns error if request body does not match schema', async () => {
        let q1 = request(app).post(`/books`).send({"isbn": '0123456789'});
        let q2 = request(app).post(`/books`).send({
            "isbn": '0691161518',
            "amazon_url": "http://a.co/eobPtX2",
            "author": "Matthew Lane",
            "language": "english",
            "pages": 264,
            "publisher": "Princeton University Press",
            "title": "Power-Up: Unlocking the Hidden Mathematics in Video Games",
            "year": '2017'
          });
        let q3 = request(app).post(`/books`).send({
            "isbn": '0691161518',
            "author": "Matthew Lane",
            "language": "english",
            "publisher": "Princeton University Press",
            "title": "Power-Up: Unlocking the Hidden Mathematics in Video Games",
            "year": 2017
          });
        const responses = await Promise.all([q1, q2, q3]);
        for (const response of responses) {
            expect(response.statusCode).toEqual(400);
        };
    });
});

describe('PUT /books/:isbn', () => {
    
    test('Updates and returns book', async () => {
        const resp = await request(app).put(`/books/${testBook.isbn}`).send({
            "isbn": "0691161518",
            "amazon_url": "http://a.co/eobPtX2",
            "author": "Matthew Lane",
            "language": "english",
            "pages": 264,
            "publisher": "Princeton University Press",
            "title": "Power-Up: Unlocking the Hidden Mathematics in Video Games",
            "year": 2017
          });
        expect(resp.body).toEqual({book: {
            "isbn": testBook.isbn,
            "amazon_url": "http://a.co/eobPtX2",
            "author": "Matthew Lane",
            "language": "english",
            "pages": 264,
            "publisher": "Princeton University Press",
            "title": "Power-Up: Unlocking the Hidden Mathematics in Video Games",
            "year": 2017
          }});
        expect(resp.statusCode).toEqual(200);
    });

    test('Returns error if request body does not match schema', async () => {
        let q1 = request(app).put(`/books/${testBook.isbn}`).send({"isbn": '0123456789'});
        let q2 = request(app).put(`/books/${testBook.isbn}`).send({
            "isbn": '0691161518',
            "amazon_url": "http://a.co/eobPtX2",
            "author": "Matthew Lane",
            "language": "english",
            "pages": 264,
            "publisher": "Princeton University Press",
            "title": "Power-Up: Unlocking the Hidden Mathematics in Video Games",
            "year": '2017'
          });
        let q3 = request(app).put(`/books/${testBook.isbn}`).send({
            "isbn": '0691161518',
            "author": "Matthew Lane",
            "language": "english",
            "publisher": "Princeton University Press",
            "title": "Power-Up: Unlocking the Hidden Mathematics in Video Games",
            "year": 2017
          });
        const responses = await Promise.all([q1, q2, q3]);
        for (const response of responses) {
            expect(response.statusCode).toEqual(400);
        };
    });

    test('Returns 404 if book is not found', async () => {
        const resp = await request(app).put(`/books/0123456789`).send({
            "isbn": "0691161518",
            "amazon_url": "http://a.co/eobPtX2",
            "author": "Matthew Lane",
            "language": "english",
            "pages": 264,
            "publisher": "Princeton University Press",
            "title": "Power-Up: Unlocking the Hidden Mathematics in Video Games",
            "year": 2017
          });
        expect(resp.statusCode).toEqual(404)
    });
});

describe('DELETE /books/:isbn', () => {
    
    test('Deletes a single book', async () => {
        const resp = await request(app).delete(`/books/${testBook.isbn}`);
        expect(resp.body).toEqual({ message: "Book deleted" })
        expect(resp.statusCode).toEqual(200)
    });
});