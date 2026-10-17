package com.novelia.upload.service;

import com.novelia.upload.dto.FileUploadResponse;
import org.springframework.web.multipart.MultipartFile;

public interface FileUploadService {
    FileUploadResponse uploadBookCover(MultipartFile file);
}
