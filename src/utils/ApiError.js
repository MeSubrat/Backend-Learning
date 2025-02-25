class ApiError extends Error{
    constructor(
        statusCode, 
        message="Something went wrong",
        errors=[],
        stack=""
    ){
        super(message)
        this.statusCode=statusCode
        this.data=null
        this.message=message
        this.success=false //Here we returnig false due to we are handling api error not api response.
        this.errors=errors

        if(stack)
        {
            this.stack=stack
        }
        else{
            Error.captureStackTrace(this,this.constructor)
        }
    }
}

export {ApiError}