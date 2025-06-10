import nodemailer from 'nodemailer'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Create a transporter with Zoho Mail settings
const transporter = nodemailer.createTransport({
    host: "smtp.zoho.com",
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: "doctor.tnx2023@zohomail.com",
        pass: "doctortn1234@2024"
    },
    tls: {
        ciphers: 'SSLv3'
    }
})

// Verify transporter configuration
transporter.verify(function (error, success) {
    if (error) {
        console.error('Email transporter verification failed:', error)
    } else {
        console.log('Email transporter is ready to send messages')
    }
})

// Function to send email
const sendEmail = async ({ to, subject, html, text, context = {} }) => {
    try {
        // If HTML is a path to a template, read and use it
        if (html && typeof html === 'string' && html.endsWith('.html')) {
            const templatePath = path.join(process.cwd(), html)
            if (fs.existsSync(templatePath)) {
                let template = fs.readFileSync(templatePath, 'utf8')

                // Replace template variables with context values
                Object.entries(context).forEach(([key, value]) => {
                    const regex = new RegExp(`{{${key}}}`, 'g')
                    template = template.replace(regex, value)
                })

                html = template
            } else {
                console.error('Template not found:', templatePath)
                throw new Error('Email template not found')
            }
        }

        const mailOptions = {
            from: "doctor.tnx2023@zohomail.com",
            to,
            subject,
            html,
            text: text || 'Please enable HTML to view this email'
        }

        const info = await transporter.sendMail(mailOptions)
        console.log('Email sent:', info.messageId)
        return info
    } catch (error) {
        console.error('Error sending email:', error)
        throw error
    }
}

export default sendEmail 