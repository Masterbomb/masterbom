import express from 'express';
import createError from 'http-errors';
import path from "path";
import routes from './routes';
import dotenv from "dotenv";
import pgPromise from "pg-promise";

dotenv.config();

// port is now available to the Node.js runtime
// as if it were an environment variable
const port = process.env.SERVER_PORT;

// configure postgres with types that pgp accepts
const config = {
    database: process.env.PGDATABASE || "postgres",
    host: process.env.PGHOST || "localhost",
    port: parseInt(process.env.PGPORT || "5432", 10),
    user: process.env.PGUSER || "postgres"
} as Parameters<typeof pgp>[0];

// rename pgp
const pgp = pgPromise();
const db = pgp(config);

const app = express();
// setup view engine
app.set('views', path.join(__dirname, '../dist/views'));
app.set('view engine', 'ejs');
app.set('db', db);

// add logger middleware to express app
app.use((request:express.Request, _, next:express.NextFunction) => {
    console.log(`${request.method} ${request.path}`);
    next();
});
// add all routes to app
app.use(routes);
// use express types
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
// bind statics to app
app.use(express.static(path.join(__dirname, 'public')));

// start webserver
app.listen(port, () => {
    console.log(`server started at http://localhost:${ port }`);
});

app.use((_1, _2, next:express.NextFunction) => {
    // forward 404 error
    next(createError(404));
});

// custom error handler
app.use((err:createError.HttpError, request:express.Request, response:express.Response) => {
    // set locals, only providing error in development
    response.locals.message = err.message;
    response.locals.error = request.app.get('NODE_ENV') === 'development' ? err : {};
    // render the error page
    response.status(err.status || 500);
    response.render('error');
});