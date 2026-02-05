import mongoose from "mongoose";


const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI || '');
        console.log(`MongoDB Connected: ${conn.connection.host} Database name: ${conn.connection.name}`);
    } catch (err: any) {
        console.log(`Connection to database fail`);
        process.exit(1);
    }
}


export default connectDB