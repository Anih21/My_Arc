import mongoose from 'mongoose';
const schema=new mongoose.Schema({userId:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true},date:{type:String,required:true},totalTasks:Number,completedTasks:Number,score:Number,xpEarned:Number},{timestamps:true});schema.index({userId:1,date:1},{unique:true});export default mongoose.model('DailyScore',schema);
