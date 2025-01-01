class ApiError extends Error{ // fyi ofcos  Error class has it's own constructor so we want to inherit some
    constructor(statusCode,message='soething went wrong',errors=[],statck=''){

        super(message)
        this.statusCode=statusCode
        this.data=null
        this.message=message
        this.success=false
        thia.errors=errors

        if (statck) {
            this.stack=statck
        } else {
            Error.captureStackTrace(this,this.constructor)
        }
        
    }
}

export default ApiError;