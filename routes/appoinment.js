require('dotenv').config()
const express = require('express')
const router = express.Router()
const { v4: uuidv4 } = require('uuid');

const { Appoinments } = require('../models/appoinment')
const { UserDetails } = require('../models/users')

const mongoose = require('mongoose');
const isAuthenticated = require('../middlware/auth');
const isUserValidate = require('../middlware/user');
const isDoctor = require('../middlware/doctor');



router.post('/request', isAuthenticated, isUserValidate, async (req, res) => {
    try {
        const { doctor_email, appointment_time, doctor_name } = req.body;
        const current_user = req.user["email"];
        const user = await UserDetails.findOne({ email: current_user });
        const doctor = await UserDetails.findOne({ email: doctor_email });
        const appoinment = await Appoinments.findOne({ user: current_user });
        if (appoinment === null) {
            const newAppoinment = new Appoinments({
                appointment_id: uuidv4(),
                user_name: user.full_name,
                doctor_user: doctor.full_name, // doctor.full_name
                appointment_time: appointment_time,
                user: current_user,
                doctor_email: doctor_email,
                doctor_name: doctor_name,
                appointment_status: "requested",
            });
            await newAppoinment.save()
            return res.status(200).json({ message: "Appoinment Booked" });
        }
        else {
            return res.status(403).json({ message: "User already booked a appoinment" });
        }
    } catch (err) {
        console.log(err);
        return res.status(400).json({ message: err.message });

    }
});

router.post('/accept', isAuthenticated, isUserValidate, isDoctor, async (req, res) => {
    try {
        const { appointment_id } = req.body;
        const current_user = req.user["email"];
        const appoinment = await Appoinments.findOne({ appointment_id: appointment_id, doctor_email: current_user });
        if (appoinment === null) {
            return res.status(404).json({ message: "Appoinment Not Found" });
        }
        else {
            appoinment.appointment_status = "accepted"
            await appoinment.save()
            return res.status(200).json({ message: "Appoinment Accepted" });
        }
    } catch (err) {
        console.log(err);
        return res.status(400).json({ message: err.message });

    }
});

router.post('/reject', isAuthenticated, isUserValidate, isDoctor, async (req, res) => {
    try {
        const { appointment_id, reject_reason } = req.body;
        const current_user = req.user["email"];
        const appoinment = await Appoinments.findOne({ appointment_id: appointment_id, doctor_email: current_user });
        if (!reject_reason) {
            return res.status(404).json({ message: "Reject Reason Not Provided" });
        }
        if (appoinment === null) {
            return res.status(404).json({ message: "Appoinment Not Found" });
        }
        else {
            appoinment.appointment_status = "rejected"
            appoinment.reject_reason = reject_reason
            await appoinment.save()
            return res.status(200).json({ message: "Appoinment Rejected" });
        }
    } catch (err) {
        console.log(err);
        return res.status(400).json({ message: err.message });

    }
});

router.get('/get-appoinments-users', isAuthenticated, isUserValidate, async (req, res) => {
    try {
        const current_user = req.user["email"];
        const appoinment = await Appoinments.find({ user: current_user, appointment_status: { $ne: 'rejected' } }).select('-_id -__v -created_at -updated_at')
        if (appoinment === null) {
            return res.status(200).json({ message: "No Appoinment Booked" });
        }
        else {
            return res.status(200).json({ message: "User appoinment details", appoinment: appoinment });
        }
    } catch (err) {
        console.log(err);
        return res.status(400).json({ message: err.message });

    }
});

router.get('/get-appoinments-doctor', isAuthenticated, isUserValidate, isDoctor, async (req, res) => {
    try {
        const current_user = req.user["email"];
        const appoinment = await Appoinments.find({ doctor_user: current_user, appointment_status: { $ne: 'rejected' } }).select('-_id -__v -created_at -updated_at -doctor_name')
        if (appoinment === null) {
            return res.status(200).json({ message: "No Appoinment Booked" });
        }
        else {
            return res.status(200).json({ message: "User appoinment details", appoinment: appoinment });
        }
    } catch (err) {
        console.log(err);
        return res.status(400).json({ message: err.message });

    }
});
module.exports = router;