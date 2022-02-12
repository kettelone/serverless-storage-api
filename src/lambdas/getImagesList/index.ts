interface GetImageEvent{
    requestContext:{
        authorizer:{
            claims:{
                email:string
            }
        }
    }
}

export { GetImageEvent };
