class Response {
    data = null;
    status = null;
    successMessage = null;
    errorMessage = null;
    success = null;

    constructor(data, message){
        this.data = data?.data ? data.data : null;
        this.status = data?.status 
        this.timestamp = new Date().toISOString();

        switch (this.status) {
            case 200: // OK
                this.successMessage = message;
                this.success = true;
                break;
            
            case 201: // Created
                this.successMessage = message;
                this.success = true;
                break;

            case 400: // Bad Request
                this.errorMessage = message;
                this.success = false;
                break;
            
            case 401: // Unauthorized
                this.errorMessage = message;
                this.success = false;
                break;
            
            case 403: // Forbidden
                this.errorMessage = message;
                this.success = false;
                break;
            
            case 404: // Not Found
                this.errorMessage = message;
                this.success = false;
                break;

            case 409: // Conflict
                this.errorMessage = message;
                this.success = false;
                break;
            
            case 429: // Too Many Requests
                this.errorMessage = message; 
                this.success = false;
                break;
            
            case 500: // Internal Server Error
                this.errorMessage = message;
                this.success = false;
                break;
            
            default:
                this.success = false;
                this.errorMessage = message || "Unknown error";
                break;
        }
    }

    toJSON() {
        return {
            data: this.data,
            status: this.status,
            success: this.success,
            successMessage: this.successMessage,
            errorMessage:this.errorMessage,
            timestamp: this.timestamp,
        };
    }

    static ok(data, message = "Success") {
        return new Response({ data, status: 200 }, message);
    }
    
    static created(data, message = "Resource created successfully") {
        return new Response({ data, status: 201 }, message);
    }
    
    // Static methods for error responses
    static badRequest(message = "Bad request", data = null) {
        return new Response({ data, status: 400 }, message);
    }
    
    static unauthorized(message = "Unauthorized", data = null) {
        return new Response({ data, status: 401 }, message);
    }
    
    static forbidden(message = "Forbidden", data = null) {
        return new Response({ data, status: 403 }, message);
    }
    
    static notFound(message = "Resource not found", data = null) {
        return new Response({ data, status: 404 }, message);
    }
    
    static conflict(message = "Resource already exists", data = null) {
        return new Response({ data, status: 409 }, message);
    }
    
    static tooManyRequests(message = "Too many requests", data = null) {
        return new Response({ data, status: 429 }, message);
    }
    
    static internalServerError(message = "Internal server error", data = null) {
        return new Response({ data, status: 500 }, message);
    }
}

export default Response;