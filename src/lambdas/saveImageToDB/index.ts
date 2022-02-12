interface S3Event{
    Records:[
        {
            s3:{
                object:{
                    key:string
                }
            }
        }]
}

export { S3Event };
