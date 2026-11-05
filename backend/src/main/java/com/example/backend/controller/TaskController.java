
package com.example.backend.controller;

import com.example.backend.model.Task;
import com.example.backend.service.TaskService;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;

import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/tasks")
public class TaskController {

    private final TaskService taskService;

    public TaskController(TaskService taskService) {
        this.taskService = taskService;
    }

    // CREATE
    @PostMapping
    public ResponseEntity<Task> createTask(
            @Valid @RequestBody Task task,
            @AuthenticationPrincipal Jwt jwt) {

        Task savedTask = taskService.createTask(
                task.getTitle(),
                jwt.getSubject()
        );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(savedTask);
    }

    // READ ALL
    @GetMapping
    public List<Task> getAllTasks(
            @AuthenticationPrincipal Jwt jwt) {

        return taskService.getAllTasks(jwt.getSubject());
    }

    // READ ONE
    @GetMapping("/{id}")
    public ResponseEntity<Task> getTaskById(
            @PathVariable Long id,
            @AuthenticationPrincipal Jwt jwt) {

        Optional<Task> task =
                taskService.getTaskById(id, jwt.getSubject());

        return task.map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    // UPDATE
    @PutMapping("/{id}")
    public ResponseEntity<Task> updateTask(
            @PathVariable Long id,
            @Valid @RequestBody Task task,
            @AuthenticationPrincipal Jwt jwt) {

        Optional<Task> updatedTask = taskService.updateTask(
                id,
                task,
                jwt.getSubject()
        );

        return updatedTask.map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    // DELETE ONE
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTask(
            @PathVariable Long id,
            @AuthenticationPrincipal Jwt jwt) {

        boolean deleted = taskService.deleteTask(
                id,
                jwt.getSubject()
        );

        if (!deleted) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.noContent().build();
    }

    // DELETE COMPLETED
    @DeleteMapping("/completed")
    public ResponseEntity<Void> deleteCompletedTasks(
            @AuthenticationPrincipal Jwt jwt) {

        taskService.deleteCompletedTasks(jwt.getSubject());

        return ResponseEntity.noContent().build();
    }
}
