import ApiFeatures from "../utils/api-features";
import Task from "../model/task.model";
import { NextFunction, Request, Response } from "express";
import catchAsync from "../utils/catch-errors";
import AppError from "../utils/app-error";
import { StatusCodes } from "http-status-codes";
import Project from "../model/project.model";

const getProjects = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const features = new ApiFeatures(
      Project.find({
        user: req.userId,
      }),
      req.query,
    )
      .filter()
      .sort()
      .limitFields()
      .paginate();

    const projects = await features.query.populate("user");

    res.status(StatusCodes.OK).json({
      status: "success",
      data: {
        projects,
      },
    });
  },
);

const getProject = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const project = await Project.findOne({
      user: req.userId,
      _id: req.params.id,
    }).populate("user");

    if (!project) {
      return next(
        new AppError(`No project found with the id ${req.params.id}`, 404),
      );
    }

    res.status(302).json({
      status: "success",
      data: {
        project,
      },
    });
  },
);

const createProject = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const existedProject = await Project.exists({
      user: req.userId,
      name: req.body.name,
    });

    if (existedProject)
      return next(
        new AppError(
          `Project with the name '${req.body.name}' already exists.`,
          StatusCodes.CONFLICT,
        ),
      );

    const project = await Project.create({
      name: req.body.name,
      description: req.body.description,
      logo: req.body.logo,
      user: req.userId,
    });

    res.status(201).json({
      status: "success",
      data: {
        project,
      },
    });
  },
);

const deleteTask = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const task = await Task.findOneAndDelete({
      user: req.userId,
      _id: req.params.id,
    });

    if (!task) {
      return next(
        new AppError(`No task found with the id ${req.params.id}`, 404),
      );
    }

    res.status(204).json({
      status: "success",
      data: null,
    });
  },
);

export { getProjects, getProject, createProject, deleteTask };
