import express from "express";
import multer from "multer";
import { groupController } from "../controllers/index.js"
import { authMiddleware, requireGroupMember } from "../middleware/auth.js";

const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { 
        fileSize: 2 * 1024 * 1024  // 2MB limit
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

const groupRouter = express.Router();

groupRouter.use(authMiddleware);

groupRouter.get("/:id", requireGroupMember, groupController.getDetails);
groupRouter.get("/:id/list", requireGroupMember, groupController.getList);
groupRouter.get("/:id/members", requireGroupMember, groupController.getMembers);
groupRouter.get("/:id/invitations", requireGroupMember, groupController.getInviteHistory);
groupRouter.post("/:id/list/items", requireGroupMember, groupController.addItem);
groupRouter.put("/:id", requireGroupMember, upload.single('group_image'), groupController.updateGroup);
groupRouter.put("/:id/list/clear", requireGroupMember, groupController.clearList);
groupRouter.delete("/:id/leave", requireGroupMember, groupController.leaveGroup);
groupRouter.delete("/:id", requireGroupMember, groupController.disbandGroup);

export default groupRouter;