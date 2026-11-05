
package com.example.backend.repository;

import com.example.backend.model.Task;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TaskRepository extends JpaRepository<Task, Long> {

    // Retrieve only the authenticated user's tasks
    List<Task> findAllByOwner_EmailIgnoreCaseOrderByIdDesc(String email);

    // Retrieve a task only when it belongs to this user
    Optional<Task> findByIdAndOwner_EmailIgnoreCase(Long id, String email);

    // Delete only this user's completed tasks
    long deleteByOwner_EmailIgnoreCaseAndCompletedTrue(String email);
}
