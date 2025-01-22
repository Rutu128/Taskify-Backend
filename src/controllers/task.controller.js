import Task from "../models/task.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";

const createTask = async (req, res) => {
  try {
    const { title, priority, startDate, endDate, status } = req.body.taskData;
    if (!title || !priority || !startDate || !endDate || !status) {
      return res.status(400).json(new ApiError(400, "Missing fields"));
    }
    const userId = req.user._id;
    let newTask = new Task({
      userId,
      title,
      status,
      priority,
      startDate,
      endDate,
    });
    const task = await newTask.save();
    return res
      .status(200)
      .json(new ApiResponse(200, { task }, "Task created successfully"));
  } catch (err) {
    console.log(err.message);
    return res.status(500).json(new ApiError(500, "server error", err));
  }
};

const getTasks = async (req, res) => {
  try {
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const totalTasks = await Task.countDocuments({ userId });

    const tasks = await Task.find({ userId }).skip(skip).limit(limit);

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          tasks,
          pagination: {
            total: totalTasks,
            totalPages: Math.ceil(totalTasks / limit),
            currentPage: page,
            limit,
          },
        },
        "Tasks fetched successfully"
      )
    );
  } catch (err) {
    console.log(err.message);
    return res.status(500).json(new ApiError(500, "server error", err));
  }
};

const updateTask = async (req, res) => {
  try {
    const taskId = req.params.id;
    const { title, priority, startDate, endDate, status } = req.body.taskData;
    if (!taskId || !title || !priority || !startDate || !endDate || !status) {
      return res.status(400).json(new ApiError(400, "Missing fields"));
    }
    const updatedTask = await Task.findByIdAndUpdate(
      taskId,
      { title, priority, status, startDate, endDate },
      { new: true }
    );
    if (!updatedTask) {
      return res.status(404).json(new ApiError(404, "Task not found"));
    }
    return res
      .status(200)
      .json(new ApiResponse(200, { updatedTask }, "Task updated successfully"));
  } catch (err) {
    console.log(err.message);
    return res.status(500).json(new ApiError(500, "server error", err));
  }
};

const deleteTask = async (req, res) => {
  try {
    const taskId = req.params.id;
    const deletedTask = await Task.findByIdAndDelete(taskId);
    if (!deletedTask) {
      return res.status(404).json(new ApiError(404, "Task not found"));
    }
    return res
      .status(200)
      .json(new ApiResponse(200, { deletedTask }, "Task deleted successfully"));
  } catch (err) {
    console.log(err.message);
    return res.status(500).json(new ApiError(500, "server error", err));
  }
};

const dashboard = async (req, res) => {
  try {
    const userId = req.user._id;
    const now = new Date();

    // Fetch all tasks for the user
    const tasks = await Task.find({ userId }).sort({ priority: 1 });

    // Basic statistics
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(
      (task) => task.status === "Finished"
    ).length;
    const pendingTasks = tasks.filter((task) => task.status !== "Finished"); 
    const completedPercentage = totalTasks
      ? Math.round((completedTasks / totalTasks) * 100)
      : 0;
    const pendingPercentage = totalTasks
      ? Math.round((pendingTasks.length / totalTasks) * 100)
      : 0;

    // Calculate average completion time for finished tasks
    const completedTasksTimes = tasks
      .filter((task) => task.status === "Finished")
      .map((task) => {
        const start = new Date(task.startDate);
        const end = new Date(task.endDate);
        return (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      });

    const averageTime = completedTasksTimes.length
      ? (
          completedTasksTimes.reduce((a, b) => a + b, 0) /
          completedTasksTimes.length
        ).toFixed(1)
      : 0;

    // Basic states object
    const states = {
      totalTasks,
      completedTasks,
      pendingTasks: pendingTasks.length,
      completedPercentage,
      pendingPercentage,
      averageTime,
    };

    // Calculate time statistics for pending tasks
    
    const totalTimeLapsed = pendingTasks.reduce((total, task) => {
      const start = new Date(task.startDate);
      const lapsedTime = (now.getTime() - start.getTime()) / (1000 * 60 * 60);
      return total + Math.max(0, lapsedTime);
    }, 0);

    const timeToFinish = pendingTasks.reduce((total, task) => {
      const end = new Date(task.endDate);
      const remainingTime = (end.getTime() - now.getTime()) / (1000 * 60 * 60);
      return total + Math.max(0, remainingTime);
    }, 0);

    // Calculate priority-based statistics
    const priorityStats = Array.from({ length: 5 }, (_, i) => {
      const priorityLevel = i + 1;
      const priorityTasks = pendingTasks.filter(
        (task) => task.priority === priorityLevel
      );

      const timeLapsed = priorityTasks.reduce((total, task) => {
        const start = new Date(task.startDate);
        const lapsedTime = (now.getTime() - start.getTime()) / (1000 * 60 * 60);
        return total + Math.max(0, lapsedTime);
      }, 0);

      const timeRemaining = priorityTasks.reduce((total, task) => {
        const end = new Date(task.endDate);
        const remainingTime =
          (end.getTime() - now.getTime()) / (1000 * 60 * 60);
        return total + Math.max(0, remainingTime);
      }, 0);

      return {
        priority: priorityLevel,
        count: priorityTasks.length,
        timeLapsed: Math.round(timeLapsed),
        timeToFinish: Math.round(timeRemaining),
      };
    });

    // Compile pending task statistics
    const pendingTaskStats = {
      totalPending: pendingTasks.length,
      totalTimeLapsed: Math.round(totalTimeLapsed),
      timeToFinish: Math.round(timeToFinish),
      priorityStats,
    };

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { states, pendingTaskStats },
          "Dashboard data fetched successfully"
        )
      );
  } catch (error) {
    console.error("Dashboard Error:", error);
    return res
      .status(500)
      .json(new ApiError(500, "Failed to fetch dashboard data", error.message));
  }
};

export { createTask, getTasks, updateTask, deleteTask, dashboard };
