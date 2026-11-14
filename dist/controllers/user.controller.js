import { usersCollection } from "../config/db.js";
export const getProfile = async (req, res) => {
    try {
        const email = req.user?.email;
        if (!email)
            return res.status(401).send({ message: "Unauthorized" });
        const user = await usersCollection.findOne({ email });
        if (!user)
            return res.status(404).send({ message: "User not found" });
        res.send({
            name: user.name,
            email: user.email,
            role: user.role,
            profileImage: user.profileImage || null,
        });
    }
    catch (error) {
        res.status(500).send({ message: "Failed to load profile" });
    }
};
export const updateProfile = async (req, res) => {
    try {
        const email = req.user?.email;
        if (!email)
            return res.status(401).send({ message: "Unauthorized" });
        const { name, email: newEmail, profileImage } = req.body;
        if (!name)
            return res.status(400).send({ message: "Name is required" });
        if (newEmail && newEmail !== email) {
            const existingUser = await usersCollection.findOne({ email: newEmail });
            if (existingUser)
                return res.status(400).send({ message: "Email already in use by another account" });
        }
        const updateData = { name };
        if (newEmail && newEmail !== email)
            updateData.email = newEmail;
        if (profileImage !== undefined)
            updateData.profileImage = profileImage;
        const result = await usersCollection.updateOne({ email }, { $set: updateData });
        if (result.matchedCount === 0)
            return res.status(404).send({ message: "User not found" });
        const updatedUser = await usersCollection.findOne({ email: newEmail || email });
        res.send({
            name: updatedUser?.name,
            email: updatedUser?.email,
            role: updatedUser?.role,
            profileImage: updatedUser?.profileImage || null,
        });
    }
    catch (error) {
        res.status(500).send({ message: "Failed to update profile" });
    }
};
