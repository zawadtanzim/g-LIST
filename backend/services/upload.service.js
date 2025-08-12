import { supabaseAdmin } from "../config/supabase.js";
import { uploadLogger } from "../utils/logger.js";

const uploadService = {
    uploadToStorage: async (bucket, userId, file, prefix = '') => {
        const fileName = `${userId}/${prefix}${Date.now()}.${file.originalname.split('.').pop()}`;
        
        const { data, error } = await supabaseAdmin.storage
            .from(bucket)
            .upload(fileName, file.buffer, {
                contentType: file.mimetype,
                upsert: true
            });
            
        if (error) throw error;
        
        const { data: publicUrl } = supabaseAdmin.storage
            .from(bucket)
            .getPublicUrl(fileName);
            
        return publicUrl.publicUrl;
    },

    deleteFromStorage: async (bucket, fileName) => {
        try {
            if (!fileName) {
                uploadLogger.warn("deleteFromStorage called without fileName");
                return; // Nothing to delete
            }
            
            // Extract just the file path from full URL if needed
            let filePath = fileName;
            if (fileName.includes('/storage/v1/object/public/')) {
                // If it's a full Supabase URL, extract just the path
                const urlParts = fileName.split('/storage/v1/object/public/')[1];
                filePath = urlParts.split('/').slice(1).join('/'); // Remove bucket name
            }
            
            const { error } = await supabaseAdmin.storage
                .from(bucket)
                .remove([filePath]);
                
            if (error) {
                uploadLogger.error(`Failed to delete file ${filePath}: ${error.message}`);
                // Don't throw - deletion failure shouldn't break the update
            } else {
                uploadLogger.info(`Successfully deleted file: ${filePath}`);
            }
            
        } catch (error) {
            uploadLogger.error(`Delete storage error: ${error.message}`);
            // Don't throw - deletion is best effort
        }
    }
};

export default uploadService;