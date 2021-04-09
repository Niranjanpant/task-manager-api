const Task = require("../models/task")
const express = require("express")
const router = new express.Router()
const auth = require("../middleware/auth")

//creating tasks
router.post("/tasks",auth,async (req,res) => {
   // const task = new Task(req.body)
    const task = new Task({
        ...req.body,
        owner:req.user._id
    })
    try{
    await task.save()
    res.status(201).send(task)
    }catch(e) {
    res.status(400).send(e)
    }
    
    // task.save()
    // .then((data) => {
    // res.send(data)
    // }).catch((e) => {
    //     res.status(400).send(e)
    // })
    
    })
    
    //getting all tasks//filtering data
    //pagination(limit and skip)
//?sortBy=createdAt:ascending
    router.get("/tasks",auth,async (req,res) => {
    const match = {}
const sort ={}

if( req.query.completed) {
 match.completed = req.query.completed === "true"
}

if(req.query.sortBy) {
const parts = req.query.sortBy.split(":")
sort[parts[0]]=parts[1]==="desc"?-1:1
}
       try{
    // const task = await Task.findOne({owner:req.user._id})
    await req.user.populate({
        path:"tasks",
        match,
        options: {
            limit:parseInt(req.query.limit),
            skip:parseInt(req.query.skip),
            sort
        }
    }).execPopulate()
    res.status(200).send(req.user.tasks)
    }
    catch(e) {
    res.status(400).send(e)
    }
    
      
    })
    
    //getting task by id
    router.get("/tasks/:id",auth,async(req,res) => {
        const _id = req.params.id
      
   
        try {
            //const task = await Task.findById(_id)
const task = await Task.findOne({_id,owner:req.user._id})

        if(!task) {
            return res.status(404).send()
        }
            res.status(200).send(task)
        }
        catch(e) {
    res.status(400).send(e)
        }
  
    })


    router.patch("/tasks/:id", auth,async(req,res) => {
        const _id = req.params.id
        const updates = Object.keys(req.body)
        const allowedUpdates = ["description","completed"]

        const isValidOperation = updates.every((update) => allowedUpdates.includes(update))
             
        if(!isValidOperation) {
            return res.status(400).send({error:"invalid operation"})
        }

        try {
            const task = await Task.findOne({_id,owner:req.user._id})
// const task = await Task.findById(_id)

if(!task) {
    res.status(404).send()
}
updates.forEach((update) => task[update] = req.body[update])
await task.save()
res.status(200).send(task)
        }catch(e) {
res.status(400).send(e)
        }
    })
    
    
//deleting the task
    router.delete("/tasks/:id",auth,async(req,res) => {
        const _id = req.params.id
        try{
            const task = await Task.findOneAndDelete({_id,owner:req.user._id})
if(!task) {
    res.status(404).send()
}
res.send(task)        
}

        catch(e){
res.status(500).send(e) 
        }
    })


    module.exports = router