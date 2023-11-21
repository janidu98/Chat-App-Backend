const Chat = require('../models/chatModel');
const User = require('../models/userModel');

// access to chat
const accessChat = async(req, res) => {
    const { userId } = req.body;

    if(!userId) {
        console.log('UserId param not sent with request');
        return res.sendStatus(400);
    }

    var isChat = await Chat.find({
        isGroupChat: false,
        $and: [
            {users: { $elemMatch: { $eq: req.user._id } } },
            {users: { $elemMatch: { $eq: userId } } },
        ],
    }).populate('users', '-password').populate('latestMessage');

    isChat = await User.populate(isChat, {
        path: "latestMessage.sender",
        select: "name pic email",
    });

    //check chat is exists
    if(isChat.length > 0) {                  // chat is exists
        res.send(isChat[0]);
    } else {                      // chat is not exists -> create chat
        var chatData = {
            chatName: "sender",
            isGroupChat: false,
            users: [req.user._id, userId],
        };

        try {
            const createChat = await Chat.create(chatData);

            const fullChat = await Chat.findOne({ _id: createChat._id}).populate("users", "-password");

            res.status(200).send(fullChat);

        } catch (error) {
            res.status(400).send(error.message)
        }
    }
} 

// fetch chats
const fetchChats = async(req, res) => {
    try {
        Chat.find({users: {$elemMatch: {$eq: req.user._id}}})
        .populate("users", "-password")
        .populate("groupAdmin", "-password")
        .populate("latestMessage")
        .sort({ updatedAt: -1 })
        .then(async (results) => {
            results = await User.populate(results, {
                path: "latestMessage.sender",
                select: "name pic email",
            });
            res.status(200).send(results);
        });
    } catch (error) {
        res.status(400).send(error.message);
    }
}

// create group chat
const createGroupChat = async(req, res) => {
    if(!req.body.users || !req.body.name) {
        return res.status(400).send({ message: "All Fields are required!"});
    }

    var users = JSON.parse(req.body.users);

    // To create a group, it is needed at least two users.
    if(users.length < 2) {
        return res.status(400).send("More than 2 users are required to create a group");
    } 

    users.push(req.user);

    //create group chat
    try {
        const groupChat = await Chat.create({
            chatName: req.body.name,
            users: users,
            isGroupChat: true,
            groupAdmin: req.user,
        });

        const fullGroupChat = await Chat.findOne({ _id: groupChat._id })
        .populate("users", "-password")
        .populate("groupAdmin", "-password");

        res.status(200).send(fullGroupChat);

    } catch (error) {
        res.status(400).send(error.message);
    }
}

// rename group
const renameGroup = async(req, res) => {
    const { chatId, chatName } = req.body;

    try {
        const updatedChat = await Chat.findByIdAndUpdate(chatId, {chatName}, {new: true})
        .populate("users", "-password")
        .populate("groupAdmin", "-password");

        if(!updatedChat) {
            res.status(404).send("Group Not Found");
        } else {
            res.status(200).send(updatedChat);
        }
    } catch (error) {
        res.status(400).send(error.message);
    }
}

// add to group
const addToGroup = async(req, res) => {
    const { chatId, userId } = req.body;

    try {
        const added = await Chat.findByIdAndUpdate(chatId, {$push: {users: userId}}, {new: true})
        .populate("users", "-password")
        .populate("groupAdmin", "-password");
    
        if(!added) {
            res.status(404).send("Chat not found");
        } else {
            res.status(200).send(added);
        }
    } catch (error) {
        res.status(400).send(error.message);
    }
}

// remove from the group
const removeFromGroup = async(req, res) => {
    const { chatId, userId } = req.body;

    try {
        const removed = await Chat.findByIdAndUpdate(chatId, {$pull: {users: userId}}, {new: true})
        .populate("users", "-password")
        .populate("groupAdmin", "-password");
    
        if(!removed) {
            res.status(404).send("Chat not found");
        } else {
            res.status(200).send(removed);
        }
    } catch (error) {
        res.status(400).send(error.message);
    }
}

module.exports = { accessChat, fetchChats, createGroupChat, renameGroup, addToGroup, removeFromGroup }