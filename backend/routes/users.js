import express from "express";
import multer from "multer";
import { userController } from "../controllers/index.js";
import { authMiddleware, requireUserOwnership, requireInvitationParticipant } from "../middleware/auth.js";

const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { 
        fileSize: 5 * 1024 * 1024  // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        // Only allow image files
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'), false);
        }
    }
});

const userRouter = express.Router();
userRouter.use(authMiddleware);

userRouter.get("/:id", requireUserOwnership, userController.getUser);
userRouter.get("/:id/groups", requireUserOwnership, userController.getGroups);
userRouter.get("/:id/list", requireUserOwnership, userController.getList);
userRouter.get("/:id/invitations/received", requireUserOwnership, userController.getReceived);
userRouter.get("/:id/invitations/sent", requireUserOwnership, userController.getSent);
userRouter.post("/:id/list/items", requireUserOwnership, userController.addItem);
userRouter.put("/:id", requireUserOwnership, upload.single('profile_pic'), userController.updateUser);
userRouter.put("/:id/list/clear", requireUserOwnership, userController.clearList);
userRouter.delete("/:id", requireUserOwnership, userController.deleteUser);

export default userRouter;