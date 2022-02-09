interface DeleteEvent{
    body:{
      key:string
    }
  }

  interface AuthEvent{
    body:{
      email: string,
      password: string
    }
  }

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

  interface GetImageEvent{
    requestContext:{
        authorizer:{
          claims:{
            email:string
          }
        }
      }
  }

  interface EventPresignedUrl {
    body:{
        url: string
    }
}

  export { DeleteEvent,AuthEvent,S3Event,UploadEvent,GetImageEvent, EventPresignedUrl}