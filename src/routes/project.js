const express = require('express')
const multer = require('multer')
const router = new express.Router()
const Project = require('../models/project')
const cors = require('cors')

router.use(cors())

const upload = multer({
    fileFilter(req, file, cb) {
        if(!file.originalname.match(/\.(png|jpg|jpeg)$/)) {
            return cb(new Error('File must be an image.'))
        }

        cb(null, true)
    }
})

// POST /projects
router.post('/projects', upload.single('preview'), async (req, res) => {
    const document = {
        ...req.body,
        preview: req.file.buffer
    }
    const project = new Project(document)
    try {
        await project.save()
        res.status(201).send(document)
    } catch(err) {
        console.log(err)
        res.status(500).send()
    }
})

// GET /projects?titleOnly=true : returns only titles of projects
router.get('/projects', async (req, res) => {
    const selectOptions = {}

    if(req.query.titleOnly) {
        selectOptions.title = 1
    }

    try {
        const projects = await Project.find({}).select(selectOptions)
        res.send(projects)
    } catch(err) {
        res.status(500).send()
    }
})

// GET /projects/:id
router.get('/projects/:id', async (req, res) => {
    try {
        const project = await Project.findById(req.params.id)
        if(!project) {
            return res.status(404).send()
        }

        res.send(project)
    } catch(err) {
        res.status(500).send()
    }
})

// PATCH /projects/:id
router.patch('/projects/:id', upload.single('preview'), async (req, res) => {
    const allowedUpdates = ['title', 'description', 'demo', 'code', 'tech']
    const updates = Object.keys(req.body)
    const isUpdateValid = updates.every(update => allowedUpdates.includes(update))

    if(!isUpdateValid) {
        return res.status(400).send({error: 'Invalid updates'})
    }

    try {
        const project = await Project.findById(req.params.id)
        if(!project) {
            return res.status(404).send()
        }
        
        updates.forEach(update => {
            project[update] = req.body[update]
        })
        // update preview if only preview file was updated
        if(req.file) {
            project.preview = req.file.buffer
        }
        
        await project.save()
        res.send(project)
    } catch(err) {
        res.status(500).send()
    }
})

module.exports = router