package com.novelia.upload.service;

import com.novelia.common.exception.BadRequestException;
import com.novelia.upload.dto.FileUploadResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
public class FileUploadServiceImpl implements FileUploadService {

    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
    private static final List<String> ALLOWED_CONTENT_TYPES = Arrays.asList(
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/gif"
    );
    private static final List<String> ALLOWED_EXTENSIONS = Arrays.asList(
            "jpg", "jpeg", "png", "webp", "gif"
    );

    @Value("${app.upload.dir:uploads/books}")
    private String uploadDir;

    @Override
    public FileUploadResponse uploadBookCover(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Vui lòng chọn file ảnh để tải lên");
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new BadRequestException("Kích thước file ảnh không được vượt quá 5MB");
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase())) {
            throw new BadRequestException("Định dạng file không hợp lệ. Chỉ chấp nhận ảnh JPG, PNG, WEBP hoặc GIF");
        }

        String originalFilename = StringUtils.cleanPath(
                file.getOriginalFilename() != null ? file.getOriginalFilename() : "cover.jpg"
        );

        // Prevent path traversal attack
        if (originalFilename.contains("..") || originalFilename.contains("/") || originalFilename.contains("\\")) {
            throw new BadRequestException("Tên file không hợp lệ");
        }

        String extension = getFileExtension(originalFilename);
        if (!ALLOWED_EXTENSIONS.contains(extension.toLowerCase())) {
            throw new BadRequestException("Phần mở rộng file không hợp lệ: ." + extension);
        }

        // Generate safe unique filename
        String safeFileName = UUID.randomUUID().toString() + "." + extension.toLowerCase();

        try {
            Path targetLocation = Paths.get(uploadDir).toAbsolutePath().normalize();
            Files.createDirectories(targetLocation);

            Path destination = targetLocation.resolve(safeFileName).normalize();
            if (!destination.startsWith(targetLocation)) {
                throw new BadRequestException("Đường dẫn lưu trữ không hợp lệ");
            }

            try (InputStream inputStream = file.getInputStream()) {
                Files.copy(inputStream, destination, StandardCopyOption.REPLACE_EXISTING);
            }

            String publicUrl = "/uploads/books/" + safeFileName;
            log.info("Uploaded book cover successfully: {} -> {}", originalFilename, destination);

            return FileUploadResponse.builder()
                    .url(publicUrl)
                    .fileName(safeFileName)
                    .fileSize(file.getSize())
                    .contentType(contentType)
                    .build();

        } catch (IOException e) {
            log.error("Failed to store file {}", originalFilename, e);
            throw new BadRequestException("Không thể lưu trữ file ảnh: " + e.getMessage());
        }
    }

    private String getFileExtension(String filename) {
        int lastDotIndex = filename.lastIndexOf('.');
        if (lastDotIndex == -1 || lastDotIndex == filename.length() - 1) {
            return "jpg";
        }
        return filename.substring(lastDotIndex + 1);
    }
}
