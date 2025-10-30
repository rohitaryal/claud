export interface User {
  // Unique primary identifier for each user
  // But user should never know about their uuid
  // NOTE: Never leak this one please
  uuid: string
  // Another primary identifier but known to user
  username: string
  // This should be unique too
  email: string
  hashedPassword: string
  // Unique file bucket id for their own file's location
  fileBucketID: string
}
