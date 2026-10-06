import mongoose from 'mongoose';
const taskSchema=new mongoose.Schema({userId:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true,index:true},title:{type:String,required:true,trim:true},category:{type:String,default:'General'},frequency:{type:String,default:'daily'},active:{type:Boolean,default:true}},{timestamps:true});
export default mongoose.model('Task',taskSchema);
