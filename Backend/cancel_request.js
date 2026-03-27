import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const uri = process.env.MONGODB_URI;

async function cancelRequest() {
  try {
    await mongoose.connect(uri);
    console.log("Connected to MongoDB");

    const User = mongoose.model("User", new mongoose.Schema({}, { strict: false }));
    const Session = mongoose.model("Session", new mongoose.Schema({}, { strict: false }));
    const Transaction = mongoose.model("Transaction", new mongoose.Schema({}, { strict: false }));

    const learner = await User.findOne({ email: "kirtan.chauhan894@gmail.com" });
    const provider = await User.findOne({ email: "20220702119@karnavatiuniversity.edu.in" });

    if (!learner || !provider) {
      console.error("Could not find both users");
      process.exit(1);
    }

    console.log(`Learner ID: ${learner._id}`);
    console.log(`Provider ID: ${provider._id}`);

    const existingRequest = await Session.findOne({
      learner: learner._id,
      mentor: provider._id,
      type: "instant_help",
      status: "pending",
    });

    if (!existingRequest) {
      console.log("No pending instant help request found between these two users.");
      process.exit(0);
    }

    console.log(`Found pending request. Credits escrowed: ${existingRequest.creditsEscrowed}`);

    // Cancel request and refund credits
    await Session.updateOne({ _id: existingRequest._id }, { $set: { status: "cancelled", cancelledAt: new Date() } });
    
    await User.updateOne({ _id: learner._id }, { $inc: { credits: existingRequest.creditsEscrowed } });

    await Transaction.create({
      userId: learner._id,
      amount: 0,
      credits: existingRequest.creditsEscrowed,
      status: "transfer_received",
      description: "Refund: Instant help cancelled manually",
      paymentId: `IH_REF_${Date.now()}_MANUAL`,
    });

    console.log("Successfully cancelled the request and refunded credits.");

  } catch (error) {
    console.error("Error:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

cancelRequest();
