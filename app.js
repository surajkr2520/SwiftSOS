const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const geolib = require('geolib');
const app = express();
const fs = require('fs');
const ejs = require('ejs');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const cors = require('cors');

dotenv.config();
const port = process.env.PORT || 9500;

// Middleware
app.use('/static', express.static('static'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(bodyParser.json());
app.use(cors());

// Connect to MongoDB
const loginConnection = mongoose.createConnection(process.env.LOGIN_DB_URI);

const garageConnection = mongoose.createConnection(process.env.GARAGE_DB_URI);

loginConnection.on('error', console.error.bind(console, 'Login connection error:'));
garageConnection.on('error', console.error.bind(console, 'Garage connection error:'));

loginConnection.once('connected', () => {
    console.log('Connected to MongoDB (login)');
});
garageConnection.once('connected', () => {
    console.log('Connected to MongoDB (garage)');
});

const GarageSchema = new mongoose.Schema(
    {
        username: { type: String, required: true },
        password: { type: String, required: true },
        address: { type: String, required: true },
        latitude: { type: Number, required: true },
        longitude: { type: String, required: true },
        phoneno: { type: Number, required: true }
    },
    { timestamps: true }
);

const garage = garageConnection.model('garage', GarageSchema);

const LoginSchema = new mongoose.Schema(
    {
        username: { type: String, required: true },
        password: { type: String, required: true },
        phoneno: { type: String, required: true }
    },
    { timestamps: true }
);
const Login = loginConnection.model('Login', LoginSchema);
//Request Schema
const RequestSchema = new mongoose.Schema(
    {
        vehicleType: { type: String, required: true },
        serviceType: { type: String, required: true },
        addInfo: { type: String, required: false },
        latitude: { type: Number, required: true },
        longitude: { type: Number, required: true },
        // request: { type: Number, required: false }
        request: { type: Number, default: 2 }
    },
    { timestamps: true }
);

const Request = loginConnection.model('Request', RequestSchema);


app.get('/', (req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'views', 'login.html'));
});

// Routes
app.get('/SwiftSOS', (req, res) => {
    const { username } = req.query;
    fs.readFile(path.join(__dirname, 'views', 'SwiftSOS.html'), 'utf-8', (err, data) => {
        if (err) {
            console.error('Error reading HTML file:', err);
            res.status(500).send('Server error');
            return;
        }
        const renderedHtml = ejs.render(data, { username: username });
        res.send(renderedHtml);
    });
});


// Render the login page
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'login.html'));
});


// Handle login form submission
app.post('/login', async (req, res) => {
    const { username, password, role } = req.body;

    try {
        let user;
        if (role === 'garage') {
            user = await garage.findOne({ username: username, password: password });
        } else {
            user = await Login.findOne({ username: username, password: password });
        }

        if (user) {
            if (role === 'garage') {
                res.redirect(`/GarageDashboard`);
            } else {
                res.redirect(`/SwiftSOS?username=${encodeURIComponent(username)}`);
            }
        } else {
            res.status(401).send('Invalid username or password');
        }
    } catch (error) {
        console.error(error);
        if (!res.headersSent) {
            res.status(500).send('Error processing request');
        }
    }
});


// Render the signup page
app.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'sign_up.html'));
});

// Handle signup form submission
app.post('/signup', async (req, res) => {
    const { username, password,phoneno } = req.body;
    const newLogin = new Login({
        username: username,
        password: password,
        phoneno: phoneno
    });
    try {
        await newLogin.save();
        res.send(`
            <p>Data saved successfully. Redirecting to SwiftSOS...</p>
            <script>
                setTimeout(function() {
                    window.location.href = '/SwiftSOS?username=${encodeURIComponent(username)}';
                }, 2000); // Redirect after 2 seconds
            </script>
        `);
    } catch (error) {
        console.error(error);
        if (!res.headersSent) {
            res.status(500).send('Error saving to database');
        }
    }
});

// Endpoint to fetch garages
app.get('/garages', async (req, res) => {
    try {
        const garages = await garage.find({});
        res.json(garages);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error fetching garages');
    }
});

app.get('/DasboardUser.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'DasboardUser.html'));
});

app.get('/GarageDashboard', (req, res) => {
    const { username } = req.query;
    fs.readFile(path.join(__dirname, 'views', 'GarageDasboard.html'), 'utf-8', (err, data) => {
        if (err) {
            console.error('Error reading HTML file:', err);
            res.status(500).send('Server error');
            return;
        }
        const renderedHtml = ejs.render(data, { username: username });
        res.send(renderedHtml);
    });
});

app.post('/api/request', async (req, res) => {
    const { vehicleType, serviceType, addInfo, latitude, longitude, request } = req.body;
    const newRequest = new Request({
        vehicleType,
        serviceType,
        addInfo,
        latitude,
        longitude,
        request
    });

    try {
        await newRequest.save();
        res.status(201).send('Request saved');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error saving request');
    }
});
// Endpoint to fetch service requests
app.get('/service-requests', async (req, res) => {
    try {
        const serviceRequests = await Request.find({});
        res.json(serviceRequests);
    } catch (error) {
        console.error('Error fetching service requests:', error);
        res.status(500).send('Error fetching service requests');
    }
});
app.post('/update-request/:id', async (req, res) => {
    try {
        const requestId = req.params.id;
        const { request } = req.body;
        console.log(`Updating request ID ${requestId} to status ${request}`);

        await Request.findByIdAndUpdate(requestId, { request });

        res.status(200).send('Request updated successfully');
    } catch (error) {
        console.error('Error updating request:', error);
        res.status(500).send('Error updating request');
    }
});



app.delete('/delete-other-requests/:acceptedRequestId', async (req, res) => {
    try {
        const acceptedRequestId = req.params.acceptedRequestId;

        await Request.deleteMany({ _id: { $ne: acceptedRequestId } });

        res.status(200).send('Other requests deleted successfully');
    } catch (error) {
        res.status(500).send('Error deleting other requests');
    }
});
app.get('/accepted-request', async (req, res) => {
    try {
        const acceptedRequest = await Request.findOne({ request: 1 }); // Assuming 1 means accepted

        if (acceptedRequest) {
            res.json({
                latitude: acceptedRequest.latitude,
                longitude: acceptedRequest.longitude
            });
        } else {
            res.status(404).send('No accepted request found');
        }
    } catch (error) {
        console.error('Error fetching accepted request:', error);
        res.status(500).send('Error fetching accepted request');
    }
});

// Endpoint to fetch the request value of a specific request by ID
app.get('/request-value/:id', async (req, res) => {
    try {
        const requestId = req.params.id;
        const request = await Request.findById(requestId, 'request');

        if (request) {
            res.json({ requestValue: request.request });
        } else {
            res.status(404).send('Request not found');
        }
    } catch (error) {
        console.error('Error fetching request value:', error);
        res.status(500).send('Error fetching request value');
    }
});

app.listen(port, () => {
    console.log(`Server is running http://localhost:${port}`);
});
