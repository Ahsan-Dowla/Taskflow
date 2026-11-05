
package com.example.backend.service;

import com.example.backend.model.AppUser;
import com.example.backend.model.Task;

import com.example.backend.repository.TaskRepository;
import com.example.backend.repository.UserRepository;

import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class TaskService {

    private final TaskRepository taskRepository;
    private final UserRepository userRepository;

    public TaskService(
            TaskRepository taskRepository,
            UserRepository userRepository) {

        this.taskRepository = taskRepository;
        this.userRepository = userRepository;
    }

    // Find the authenticated user
    private AppUser getUser(String email) {

        return userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() ->
                        new UsernameNotFoundException("User not found")
                );
    }

    // CREATE
    public Task createTask(String title, String email) {

        AppUser owner = getUser(email);

        Task task = new Task(
                null,
                title,
                false,
                owner
        );

        return taskRepository.save(task);
    }

    // READ ALL
    public List<Task> getAllTasks(String email) {

        return taskRepository
                .findAllByOwner_EmailIgnoreCaseOrderByIdDesc(email);
    }

    // READ ONE
    public Optional<Task> getTaskById(Long id, String email) {

        return taskRepository
                .findByIdAndOwner_EmailIgnoreCase(id, email);
    }

    // UPDATE
    public Optional<Task> updateTask(
            Long id,
            Task updatedTask,
            String email) {

        return taskRepository
                .findByIdAndOwner_EmailIgnoreCase(id, email)
                .map(existingTask -> {

                    existingTask.setTitle(updatedTask.getTitle());

                    existingTask.setCompleted(
                            updatedTask.isCompleted()
                    );

                    return taskRepository.save(existingTask);
                });
    }

    // DELETE ONE
    public boolean deleteTask(Long id, String email) {

        Optional<Task> task =
                taskRepository.findByIdAndOwner_EmailIgnoreCase(id, email);

        if (task.isEmpty()) {
            return false;
        }

        taskRepository.delete(task.get());

        return true;
    }

    // DELETE ALL COMPLETED
    @Transactional
    public long deleteCompletedTasks(String email) {

        return taskRepository
                .deleteByOwner_EmailIgnoreCaseAndCompletedTrue(email);
    }
}
