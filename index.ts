import sio from 'socket.io-client';
import axios from 'axios';
import express from 'express';

const app = express();

app.get('/', (_req, res) => {
    res.send('h');
});

app.listen(3000, () => {
    console.log('Listening on port 3000');
});

const io = sio('https://proxymanager.1nch.dev');

io.on('connect', () => {
    console.log('Connected to proxy manager');

    io.emit('register', {
        slug: process.env.REPL_SLUG,
        owner: process.env.REPL_OWNER
    });
});

io.on('message', async (message) => {
    const {
        headers,
        body,
        url,
        method,
        nonce
    } = message;

    if (!nonce) {
        return;
    }

    const response = await axios({
        url,
        method,
        headers,
        data: body,
        responseType: 'arraybuffer'
    }).catch((error) => {
        console.log(error);

        if (error.response) {
            return error.response;
        } else {
            return {
                status: 500,
                headers: {},
                data: 'Internal server error'
            };
        }
    });

    io.emit('message', {
        headers: response.headers,
        code: response.status,
        body: response.data,
        nonce
    });
});

io.on('disconnect', () => {
    console.log('Disconnected from proxy manager');

    const connectionInterval = setInterval(() => {
        io.connect();
    }, 5000);

    io.once('connect', () => {
        clearInterval(connectionInterval);
    });
});
