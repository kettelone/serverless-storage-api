interface UploadEvent{
    requestContext:{
        authorizer:{
            claims:{
                email:string
            }
        }
    },
    queryStringParameters:{
        key:string
    }
}

export { UploadEvent };
